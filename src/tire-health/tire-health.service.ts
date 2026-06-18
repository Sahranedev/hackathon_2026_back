import { Injectable, NotFoundException } from '@nestjs/common';
import { AlertPersistenceService } from 'src/alerts/alert-persistence.service';
import { TireData, TireSensorReading } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { AlertMetadata } from 'src/types/alerts.type';
import { CreateTireSensorReadingDto } from 'src/tire-sensor/dto/create-tire-sensor-reading.dto';
import { TiresService } from 'src/tires/tires.service';
import {
  UserTiresService,
  UserTireWithProduct,
} from 'src/tires/user-tires.service';
import { TireHealthAnalysisResult } from './types/tire-health-analysis-result';

const SLOW_LEAK_ALERT_TYPE = 'SLOW_LEAK_SUSPECTED';
const SLOW_LEAK_RECHECK_INTERVAL = 3;

type SlowLeakState = {
  analysis: TireHealthAnalysisResult | null;
  alertCreated: boolean;
};

@Injectable()
export class TireHealthService {
  constructor(
    private readonly userTiresService: UserTiresService,
    private readonly tiresService: TiresService,
    private readonly alertPersistenceService: AlertPersistenceService,
    private readonly prisma: PrismaService,
  ) {}

  async analyzeSensorReading(reading: CreateTireSensorReadingDto) {
    const userTire = await this.userTiresService.findByDeviceId(
      reading.deviceId,
    );

    if (!userTire) {
      throw new NotFoundException('No user tire found for this sensor device');
    }

    const tireProduct = await this.getTireProduct(userTire);
    const measuredAt = reading.measuredAt
      ? new Date(reading.measuredAt)
      : new Date();

    const currentReading = await this.saveReading(
      userTire.id,
      reading,
      measuredAt,
    );
    const latestReadings =
      await this.findReadingsForCurrentAnalysis(currentReading);
    const readingCount = await this.countReadingsThroughCurrent(currentReading);
    const slowLeakState = await this.handleSlowLeakState(
      userTire.id,
      latestReadings,
      readingCount,
    );
    const analysis =
      slowLeakState.analysis ??
      this.computePressureAnalysis(tireProduct, latestReadings);
    let alertCreated = slowLeakState.alertCreated;

    if (
      !slowLeakState.analysis &&
      analysis.shouldCreateAlert &&
      analysis.alertType
    ) {
      alertCreated = await this.createAlertFromAnalysis(userTire.id, analysis);
    }

    return {
      deviceId: currentReading.deviceId,
      userTireId: userTire.id,
      tireProductName: tireProduct.model,
      pressureBar: currentReading.pressureBar,
      temperatureC: currentReading.temperatureC,
      measuredAt: currentReading.measuredAt.toISOString(),
      status: analysis.status,
      pressureStatus: analysis.status,
      alertType: analysis.alertType,
      severity: analysis.severity,
      message: analysis.message,
      recommendedAction: analysis.recommendedAction,
      alertCreated,
      pressureAlertCreated: alertCreated,
    };
  }

  private async getTireProduct(userTire: UserTireWithProduct) {
    if (userTire.tire) {
      return userTire.tire;
    }

    if (!userTire.tireId) {
      throw new NotFoundException(
        'No Michelin tire product linked to user tire',
      );
    }

    const tireProduct = await this.tiresService.findById(userTire.tireId);

    if (!tireProduct) {
      throw new NotFoundException('No Michelin tire product found');
    }

    return tireProduct;
  }

  private computePressureAnalysis(
    tireProduct: TireData,
    latestReadings: TireSensorReading[],
  ): TireHealthAnalysisResult {
    const currentReading = latestReadings[0];

    if (latestReadings.length > 1) {
      const abnormalDropAnalysis =
        this.computeAbnormalPressureDropAnalysis(latestReadings);

      if (abnormalDropAnalysis) {
        return abnormalDropAnalysis;
      }
    }

    if (currentReading.pressureBar < tireProduct.minPressure) {
      return {
        status: 'warning',
        shouldCreateAlert: true,
        alertType: 'PRESSURE_TOO_LOW',
        severity: 'warning',
        message:
          'La pression du pneu est inferieure a la recommandation Michelin.',
        recommendedAction: 'Regonfler le pneu',
      };
    }

    if (currentReading.pressureBar > tireProduct.maxPressure) {
      return {
        status: 'warning',
        shouldCreateAlert: true,
        alertType: 'PRESSURE_TOO_HIGH',
        severity: 'warning',
        message:
          'La pression du pneu est superieure a la recommandation Michelin.',
        recommendedAction: 'Adapter la pression selon votre pratique.',
      };
    }

    return {
      status: 'good',
      shouldCreateAlert: false,
      alertType: null,
      severity: null,
      message: 'Pression conforme aux recommandations Michelin.',
      recommendedAction: 'Continuer le suivi.',
    };
  }

  private async handleSlowLeakState(
    userTireId: number,
    latestReadings: TireSensorReading[],
    readingCount: number,
  ): Promise<SlowLeakState> {
    const activeSlowLeakAlert =
      await this.alertPersistenceService.findActiveAlert(
        userTireId,
        SLOW_LEAK_ALERT_TYPE,
      );

    if (activeSlowLeakAlert) {
      const metadata = activeSlowLeakAlert.metadata ?? {};
      const lastCheckedReadingCount =
        metadata.slowLeak?.lastCheckedReadingCount;

      if (typeof lastCheckedReadingCount !== 'number') {
        await this.updateSlowLeakAlertMetadata(
          activeSlowLeakAlert.id,
          metadata,
          readingCount,
        );

        return {
          analysis: this.buildSlowLeakAnalysis(),
          alertCreated: false,
        };
      }

      const shouldRecheck =
        readingCount - lastCheckedReadingCount >= SLOW_LEAK_RECHECK_INTERVAL;

      if (!shouldRecheck) {
        return {
          analysis: this.buildSlowLeakAnalysis(),
          alertCreated: false,
        };
      }

      if (this.isSlowLeakConfirmed(latestReadings)) {
        await this.updateSlowLeakAlertMetadata(
          activeSlowLeakAlert.id,
          metadata,
          readingCount,
        );

        return {
          analysis: this.buildSlowLeakAnalysis(),
          alertCreated: false,
        };
      }

      await this.alertPersistenceService.deleteActiveAlert(
        userTireId,
        SLOW_LEAK_ALERT_TYPE,
      );

      return {
        analysis: null,
        alertCreated: false,
      };
    }

    if (!this.isSlowLeakConfirmed(latestReadings)) {
      return {
        analysis: null,
        alertCreated: false,
      };
    }

    const analysis = this.buildSlowLeakAnalysis();
    const alertCreated = await this.createAlertFromAnalysis(
      userTireId,
      analysis,
      {
        slowLeak: {
          lastCheckedReadingCount: readingCount,
        },
      },
    );

    return {
      analysis,
      alertCreated,
    };
  }

  private isSlowLeakConfirmed(latestReadings: TireSensorReading[]): boolean {
    if (latestReadings.length < 3) {
      return false;
    }

    const lastThreeReadings = [...latestReadings].reverse();
    const [oldestReading, middleReading, currentReading] = lastThreeReadings;
    const pressureIsDecreasing =
      oldestReading.pressureBar > middleReading.pressureBar &&
      middleReading.pressureBar > currentReading.pressureBar;
    const totalPressureDrop =
      oldestReading.pressureBar - currentReading.pressureBar;
    const temperatures = lastThreeReadings.map(
      (sensorReading) => sensorReading.temperatureC,
    );
    const temperatureVariation =
      Math.max(...temperatures) - Math.min(...temperatures);

    return (
      pressureIsDecreasing &&
      totalPressureDrop >= 0.8 &&
      temperatureVariation <= 5
    );
  }

  private buildSlowLeakAnalysis(): TireHealthAnalysisResult {
    return {
      status: 'critical',
      shouldCreateAlert: true,
      alertType: SLOW_LEAK_ALERT_TYPE,
      severity: 'critical',
      message: 'Suspicion de crevaison lente detectee sur plusieurs mesures.',
      recommendedAction:
        'Controler le pneu et rechercher une fuite avant de rouler.',
    };
  }

  private computeAbnormalPressureDropAnalysis(
    latestReadings: TireSensorReading[],
  ): TireHealthAnalysisResult | null {
    const [currentReading, previousReading] = latestReadings;
    const pressureDrop =
      previousReading.pressureBar - currentReading.pressureBar;
    const temperatureVariation = Math.abs(
      previousReading.temperatureC - currentReading.temperatureC,
    );

    if (pressureDrop >= 0.5 && temperatureVariation <= 5) {
      return {
        status: 'warning',
        shouldCreateAlert: true,
        alertType: 'ABNORMAL_PRESSURE_DROP',
        severity: 'warning',
        message: 'Baisse de pression anormale detectee entre deux mesures.',
        recommendedAction:
          "Controler la pression et verifier l'evolution a la prochaine mesure.",
      };
    }

    return null;
  }

  private async findReadingsForCurrentAnalysis(
    currentReading: TireSensorReading,
  ): Promise<TireSensorReading[]> {
    const previousReadings = await this.prisma.tireSensorReading.findMany({
      where: {
        deviceId: currentReading.deviceId,
        OR: [
          {
            measuredAt: {
              lt: currentReading.measuredAt,
            },
          },
          {
            measuredAt: currentReading.measuredAt,
            id: {
              lt: currentReading.id,
            },
          },
        ],
      },
      orderBy: [{ measuredAt: 'desc' }, { id: 'desc' }],
      take: 2,
    });

    return [currentReading, ...previousReadings];
  }

  private countReadingsThroughCurrent(currentReading: TireSensorReading) {
    return this.prisma.tireSensorReading.count({
      where: {
        deviceId: currentReading.deviceId,
        OR: [
          {
            measuredAt: {
              lt: currentReading.measuredAt,
            },
          },
          {
            measuredAt: currentReading.measuredAt,
            id: {
              lte: currentReading.id,
            },
          },
        ],
      },
    });
  }

  private saveReading(
    userTireId: number,
    reading: CreateTireSensorReadingDto,
    measuredAt: Date,
  ) {
    return this.prisma.tireSensorReading.create({
      data: {
        deviceId: reading.deviceId,
        userTireId,
        pressureBar: reading.pressureBar,
        temperatureC: reading.temperatureC,
        measuredAt,
      },
    });
  }

  private updateSlowLeakAlertMetadata(
    alertId: number,
    metadata: AlertMetadata,
    readingCount: number,
  ) {
    return this.alertPersistenceService.updateAlertMetadata(alertId, {
      ...metadata,
      slowLeak: {
        ...metadata.slowLeak,
        lastCheckedReadingCount: readingCount,
      },
    });
  }

  private async createAlertFromAnalysis(
    userTireId: number,
    analysis: TireHealthAnalysisResult,
    metadata?: AlertMetadata,
  ): Promise<boolean> {
    if (!analysis.alertType) {
      return false;
    }

    const existingAlert = await this.alertPersistenceService.findActiveAlert(
      userTireId,
      analysis.alertType,
    );

    if (existingAlert) {
      return false;
    }

    const alert = await this.alertPersistenceService.createAlert(
      userTireId,
      analysis.alertType,
      `${this.getAlertTitle(analysis.alertType)} - ${analysis.message} ${analysis.recommendedAction}`,
      metadata,
    );

    return alert !== null;
  }

  private getAlertTitle(alertType: string) {
    switch (alertType) {
      case 'PRESSURE_TOO_LOW':
        return 'Pression trop basse';
      case 'PRESSURE_TOO_HIGH':
        return 'Pression trop elevee';
      case 'ABNORMAL_PRESSURE_DROP':
        return 'Baisse de pression anormale';
      case 'SLOW_LEAK_SUSPECTED':
        return 'Suspicion de crevaison lente';
      default:
        return 'Alerte pneu';
    }
  }
}
