import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AlertPersistenceService } from 'src/alerts/alert-persistence.service';
import type { ActivityCompletedEvent } from 'src/common/events/app-events';
import { ACTIVITY_COMPLETED } from 'src/common/events/app-events';
import { TerrainType, TireData, UserTire } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

const RECENT_UNDER_INFLATION_READINGS_LIMIT = 10;
const RECENT_USAGE_ACTIVITIES_LIMIT = 5;
const REPLACE_SOON_ALERT_TYPE = 'REPLACE_SOON';

export type TireWearStatus = 'good' | 'warning' | 'replace_soon';

export type TireWearScoreDetails = {
  mileageKm: number;
  mileagePenalty: number;
  underInflatedCount: number;
  underInflationPenalty: number;
  usagePenalty: number;
};

export type TireWearEvaluationResult = {
  userTireId: number;
  tireProductName: string;
  healthScore: number;
  healthStatus: TireWearStatus;
  healthDetails: TireWearScoreDetails;
  alertType: typeof REPLACE_SOON_ALERT_TYPE | null;
  alertCreated: boolean;
  alertCleared: boolean;
};

type UserTireWithProduct = UserTire & {
  tire: TireData | null;
};

@Injectable()
export class TireWearService {
  private readonly logger = new Logger(TireWearService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertPersistenceService: AlertPersistenceService,
  ) {}

  async evaluateUserTireWear(
    userTireId: number,
  ): Promise<TireWearEvaluationResult> {
    const userTire = await this.prisma.userTire.findUnique({
      where: { id: userTireId },
      include: { tire: true },
    });

    return this.evaluateUserTireRecord(userTire);
  }

  async evaluateUserTireWearForUser(
    userId: number,
    userTireId: number,
  ): Promise<TireWearEvaluationResult> {
    const userTire = await this.prisma.userTire.findFirst({
      where: { id: userTireId, userId },
      include: { tire: true },
    });

    return this.evaluateUserTireRecord(userTire);
  }

  async getUserTireWearSnapshot(
    userTireId: number,
  ): Promise<TireWearEvaluationResult> {
    const userTire = await this.prisma.userTire.findUnique({
      where: { id: userTireId },
      include: { tire: true },
    });

    return this.evaluateUserTireRecord(userTire, { syncAlert: false });
  }

  async getUserTireWearSnapshotForUser(
    userId: number,
    userTireId: number,
  ): Promise<TireWearEvaluationResult> {
    const userTire = await this.prisma.userTire.findFirst({
      where: { id: userTireId, userId },
      include: { tire: true },
    });

    return this.evaluateUserTireRecord(userTire, { syncAlert: false });
  }

  async evaluateActivityTires(
    activityId: number,
  ): Promise<TireWearEvaluationResult[]> {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      select: {
        tires: {
          select: {
            tireId: true,
          },
        },
      },
    });

    if (!activity) {
      return [];
    }

    const userTireIds = [
      ...new Set(activity.tires.map((activityTire) => activityTire.tireId)),
    ];

    return Promise.all(
      userTireIds.map((userTireId) => this.evaluateUserTireWear(userTireId)),
    );
  }

  @OnEvent(ACTIVITY_COMPLETED)
  async handleActivityCompleted(event: ActivityCompletedEvent) {
    try {
      await this.evaluateActivityTires(event.activityId);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown tire wear error';

      this.logger.warn(
        `Unable to evaluate tire wear after activity ${event.activityId}: ${message}`,
      );
    }
  }

  private async evaluateUserTireRecord(
    userTire: UserTireWithProduct | null,
    options: { syncAlert: boolean } = { syncAlert: true },
  ): Promise<TireWearEvaluationResult> {
    if (!userTire) {
      throw new NotFoundException('No user tire found');
    }

    if (!userTire.tire) {
      throw new NotFoundException(
        'No Michelin tire product linked to user tire',
      );
    }

    const health = await this.computeEstimatedHealth(userTire, userTire.tire);
    const alertState = options.syncAlert
      ? await this.syncReplaceSoonAlert(userTire, userTire.tire, health)
      : { created: false, cleared: false };

    return {
      userTireId: userTire.id,
      tireProductName: userTire.tire.model,
      healthScore: health.healthScore,
      healthStatus: health.healthStatus,
      healthDetails: {
        mileageKm: health.mileageKm,
        mileagePenalty: health.mileagePenalty,
        underInflatedCount: health.underInflatedCount,
        underInflationPenalty: health.underInflationPenalty,
        usagePenalty: health.usagePenalty,
      },
      alertType:
        health.healthStatus === 'replace_soon' ? REPLACE_SOON_ALERT_TYPE : null,
      alertCreated: alertState.created,
      alertCleared: alertState.cleared,
    };
  }

  private async computeEstimatedHealth(
    userTire: UserTireWithProduct,
    tireProduct: TireData,
  ) {
    const mileageKm = userTire.kilometers ?? 0;
    const mileagePenalty = this.getMileagePenalty(mileageKm);
    const underInflatedCount = await this.getUnderInflatedCount(
      userTire.id,
      tireProduct.minPressure,
    );
    const underInflationPenalty =
      this.getUnderInflationPenalty(underInflatedCount);
    const usagePenalty = await this.getUsagePenaltyForUserTire(
      userTire.id,
      tireProduct,
    );
    const healthScore = this.computeHealthScore({
      mileagePenalty,
      underInflationPenalty,
      usagePenalty,
    });

    return {
      healthScore,
      healthStatus: this.getHealthStatus(healthScore),
      mileageKm,
      mileagePenalty,
      underInflatedCount,
      underInflationPenalty,
      usagePenalty,
    };
  }

  private getMileagePenalty(km: number): number {
    if (km >= 2000) {
      return 70;
    }

    if (km >= 1500) {
      return 50;
    }

    if (km >= 1000) {
      return 30;
    }

    if (km >= 500) {
      return 15;
    }

    return 0;
  }

  private getUnderInflationPenalty(count: number): number {
    if (count >= 4) {
      return 20;
    }

    if (count >= 2) {
      return 10;
    }

    if (count === 1) {
      return 5;
    }

    return 0;
  }

  private computeHealthScore({
    mileagePenalty,
    underInflationPenalty,
    usagePenalty,
  }: {
    mileagePenalty: number;
    underInflationPenalty: number;
    usagePenalty: number;
  }): number {
    const score = 100 - mileagePenalty - underInflationPenalty - usagePenalty;

    return Math.max(0, Math.min(100, score));
  }

  private getHealthStatus(score: number): TireWearStatus {
    if (score > 70) {
      return 'good';
    }

    if (score >= 40) {
      return 'warning';
    }

    return 'replace_soon';
  }

  private async getUnderInflatedCount(
    userTireId: number,
    minPressure: number,
  ): Promise<number> {
    const recentReadings = await this.prisma.tireSensorReading.findMany({
      where: {
        userTireId,
      },
      orderBy: [{ measuredAt: 'desc' }, { id: 'desc' }],
      take: RECENT_UNDER_INFLATION_READINGS_LIMIT,
      select: {
        pressureBar: true,
      },
    });

    return recentReadings.filter((reading) => reading.pressureBar < minPressure)
      .length;
  }

  private async getUsagePenaltyForUserTire(
    userTireId: number,
    tireProduct: TireData,
  ): Promise<number> {
    if (tireProduct.terrainTypes.length === 0) {
      return 0;
    }

    const recentActivities = await this.prisma.activity.findMany({
      where: {
        tires: {
          some: {
            tireId: userTireId,
          },
        },
        terrainType: {
          not: TerrainType.UNKNOWN,
        },
      },
      orderBy: [{ date: 'desc' }, { startedAt: 'desc' }, { id: 'desc' }],
      take: RECENT_USAGE_ACTIVITIES_LIMIT,
      select: {
        terrainType: true,
      },
    });

    if (recentActivities.length === 0) {
      return 0;
    }

    return Math.max(
      ...recentActivities.map((activity) =>
        this.getUsagePenalty(tireProduct.terrainTypes, activity.terrainType),
      ),
    );
  }

  private getUsagePenalty(
    productTerrainTypes: TerrainType[],
    detectedTerrain: TerrainType,
  ): number {
    if (productTerrainTypes.includes(detectedTerrain)) {
      return 0;
    }

    if (this.isPartiallyCompatible(productTerrainTypes, detectedTerrain)) {
      return 10;
    }

    return 20;
  }

  private isPartiallyCompatible(
    productTerrainTypes: TerrainType[],
    detectedTerrain: TerrainType,
  ): boolean {
    if (
      detectedTerrain === TerrainType.MIXED ||
      productTerrainTypes.includes(TerrainType.MIXED)
    ) {
      return true;
    }

    const softOffRoadTerrains = [
      TerrainType.GRAVEL,
      TerrainType.HARD_PACKED,
      TerrainType.WET,
    ];
    const roughOffRoadTerrains = [
      TerrainType.GRAVEL,
      TerrainType.ROCKY,
      TerrainType.MUD,
      TerrainType.SOFT,
      TerrainType.SAND,
      TerrainType.WET,
    ];

    return (
      this.hasSharedTerrainGroup(
        productTerrainTypes,
        detectedTerrain,
        softOffRoadTerrains,
      ) ||
      this.hasSharedTerrainGroup(
        productTerrainTypes,
        detectedTerrain,
        roughOffRoadTerrains,
      )
    );
  }

  private hasSharedTerrainGroup(
    productTerrainTypes: TerrainType[],
    detectedTerrain: TerrainType,
    terrainGroup: TerrainType[],
  ): boolean {
    return (
      terrainGroup.includes(detectedTerrain) &&
      productTerrainTypes.some((terrain) => terrainGroup.includes(terrain))
    );
  }

  private async syncReplaceSoonAlert(
    userTire: UserTireWithProduct,
    tireProduct: TireData,
    health: {
      healthScore: number;
      healthStatus: TireWearStatus;
      mileageKm: number;
      mileagePenalty: number;
      underInflatedCount: number;
      underInflationPenalty: number;
      usagePenalty: number;
    },
  ) {
    if (health.healthStatus !== 'replace_soon') {
      const cleared = await this.alertPersistenceService.deleteActiveAlert(
        userTire.id,
        REPLACE_SOON_ALERT_TYPE,
      );

      return {
        created: false,
        cleared,
      };
    }

    const existingAlert = await this.alertPersistenceService.findActiveAlert(
      userTire.id,
      REPLACE_SOON_ALERT_TYPE,
    );

    await this.alertPersistenceService.createAlert(
      userTire.id,
      REPLACE_SOON_ALERT_TYPE,
      "L'etat estime du pneu indique qu'un remplacement est a prevoir. Planifier le remplacement du pneu avant les prochaines longues sorties.",
      {
        tireHealth: {
          healthScore: health.healthScore,
          healthStatus: health.healthStatus,
          mileageKm: health.mileageKm,
          mileagePenalty: health.mileagePenalty,
          underInflatedCount: health.underInflatedCount,
          underInflationPenalty: health.underInflationPenalty,
          usagePenalty: health.usagePenalty,
          tireProductName: tireProduct.model,
        },
      },
    );

    return {
      created: !existingAlert,
      cleared: false,
    };
  }
}
