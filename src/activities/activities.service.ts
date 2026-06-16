import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StravaService } from '../strava/strava.service';
import { Activity, TerrainType } from '../generated/prisma/client';
import { StravaActivity } from './types/strava-activity.type';

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stravaService: StravaService,
  ) {}

  async findAll(userId: number) {
    await this.syncStravaActivitiesIfConnected(userId);

    const activities = await this.prisma.activity.findMany({
      where: {
        userId,
        status: {
          not: 'CANCELLED',
        },
      },
      orderBy: [
        {
          date: 'desc',
        },
        {
          startedAt: 'desc',
        },
      ],
      include: {
        tires: true,
      },
    });

    return activities.map((activity) => this.serializeActivity(activity));
  }

  private serializeActivity(activity: Activity) {
    return {
      ...activity,
      stravaActivityId: activity.stravaActivityId
        ? activity.stravaActivityId.toString()
        : null,
    };
  }

  private async getStravaAccountOrNull(userId: number) {
    return this.prisma.stravaAccount.findUnique({
      where: {
        userId,
      },
    });
  }

  async syncStravaActivitiesIfConnected(userId: number) {
    const stravaAccount = await this.getStravaAccountOrNull(userId);

    if (!stravaAccount) {
      return {
        synced: false,
      };
    }

    const shouldSync = this.shouldSyncStrava(stravaAccount.lastSyncAt);

    if (!shouldSync) {
      return {
        synced: false,
      };
    }

    return this.syncStravaActivities(userId);
  }

  private shouldSyncStrava(lastSyncAt?: Date | null): boolean {
    if (!lastSyncAt) {
      return true;
    }

    const fifteenMinutes = 15 * 60 * 1000;
    const lastSyncTime = lastSyncAt.getTime();

    return Date.now() - lastSyncTime > fifteenMinutes;
  }

  async syncStravaActivities(userId: number) {
    const stravaAccount = await this.getStravaAccountOrNull(userId);

    if (!stravaAccount) {
      throw new NotFoundException('Aucun compte Strava lié à cet utilisateur.');
    }

    const stravaActivities = await this.stravaService.getActivities(userId);
    const cyclingActivities = stravaActivities.filter((stravaActivity) =>
      this.isCyclingActivity(stravaActivity),
    );

    let createdOrUpdated = 0;

    for (const stravaActivity of cyclingActivities) {
      const stravaActivityId = BigInt(stravaActivity.id);
      const startedAt = new Date(stravaActivity.start_date);
      const endedAt = stravaActivity.elapsed_time
        ? new Date(startedAt.getTime() + stravaActivity.elapsed_time * 1000)
        : null;
      const terrainType = this.inferTerrainType(stravaActivity);

      await this.prisma.activity.upsert({
        where: {
          userId_stravaActivityId: {
            userId,
            stravaActivityId,
          },
        },
        update: {
          name: stravaActivity.name,
          kilometers: this.metersToKilometers(stravaActivity.distance),
          durationSeconds: stravaActivity.moving_time,
          terrainType,
          startedAt,
          endedAt,
          date: startedAt,
          source: 'STRAVA',
          status: 'COMPLETED',
        },
        create: {
          userId,
          stravaActivityId,
          name: stravaActivity.name,
          kilometers: this.metersToKilometers(stravaActivity.distance),
          durationSeconds: stravaActivity.moving_time,
          terrainType,
          startedAt,
          endedAt,
          date: startedAt,
          source: 'STRAVA',
          status: 'COMPLETED',
        },
      });

      createdOrUpdated++;
    }

    await this.prisma.stravaAccount.update({
      where: {
        userId,
      },
      data: {
        lastSyncAt: new Date(),
      },
    });

    return {
      synced: true,
      createdOrUpdated,
    };
  }

  private metersToKilometers(distanceInMeters?: number | null): number {
    if (!distanceInMeters) {
      return 0;
    }

    return Number((distanceInMeters / 1000).toFixed(2));
  }

  private inferTerrainType(stravaActivity: StravaActivity): TerrainType {
    const sportType = stravaActivity.sport_type ?? stravaActivity.type;

    switch (sportType) {
      case 'GravelRide':
        return TerrainType.GRAVEL;
      case 'MountainBikeRide':
      case 'EMountainBikeRide':
        return TerrainType.TRAIL;
      case 'Ride':
      case 'EBikeRide':
        return TerrainType.ROAD;
      default:
        return TerrainType.UNKNOWN;
    }
  }

  private isCyclingActivity(stravaActivity: StravaActivity): boolean {
    if (stravaActivity.trainer) {
      return false;
    }

    const sportType = stravaActivity.sport_type ?? stravaActivity.type;

    return [
      'Ride',
      'EBikeRide',
      'GravelRide',
      'MountainBikeRide',
      'EMountainBikeRide',
    ].includes(sportType ?? '');
  }
}
