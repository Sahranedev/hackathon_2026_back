import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ACTIVITY_COMPLETED,
  ActivityCompletedEvent,
} from '../common/events/app-events';
import { PrismaService } from '../prisma/prisma.service';
import { StravaService } from '../strava/strava.service';
import {
  Activity,
  ActivityGpsPoint,
  TerrainType,
} from '../generated/prisma/client';
import { AddGpsPointDto } from './dto/add-gps-point.dto';
import { FinishActivityDto } from './dto/finish-activity.dto';
import { StartActivityDto } from './dto/start-activity.dto';
import { StravaActivity } from './types/strava-activity.type';

type ActivityWithGpsPoints = Activity & {
  gpsPoints: ActivityGpsPoint[];
};

@Injectable()
export class ActivitiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stravaService: StravaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private emitActivityCompleted(activity: {
    id: number;
    userId: number;
    kilometers: number | null;
  }): void {
    this.eventEmitter.emit(ACTIVITY_COMPLETED, {
      userId: activity.userId,
      activityId: activity.id,
      kilometers: activity.kilometers ?? 0,
    } satisfies ActivityCompletedEvent);
  }

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

  async startActivity(userId: number, startActivityDto: StartActivityDto) {
    const activeActivity = await this.prisma.activity.findFirst({
      where: {
        userId,
        source: 'APP_TRACKED',
        status: 'IN_PROGRESS',
      },
    });

    if (activeActivity) {
      throw new BadRequestException('Une activité est déjà en cours.');
    }

    const startedAt = startActivityDto.startedAt
      ? new Date(startActivityDto.startedAt)
      : new Date();

    const activity = await this.prisma.activity.create({
      data: {
        userId,
        name: startActivityDto.name ?? 'Activité vélo',
        source: 'APP_TRACKED',
        status: 'IN_PROGRESS',
        terrainType: startActivityDto.terrainType ?? TerrainType.UNKNOWN,
        startedAt,
        date: startedAt,
      },
    });

    return this.serializeActivity(activity);
  }

  async addGpsPoint(
    userId: number,
    activityId: number,
    addGpsPointDto: AddGpsPointDto,
  ) {
    const activity = await this.findAppTrackedActivityForUser(
      userId,
      activityId,
    );

    if (activity.status !== 'IN_PROGRESS') {
      throw new BadRequestException("L'activité n'est pas en cours.");
    }

    return this.prisma.activityGpsPoint.create({
      data: {
        activityId,
        latitude: addGpsPointDto.latitude,
        longitude: addGpsPointDto.longitude,
        accuracy: addGpsPointDto.accuracy,
        altitude: addGpsPointDto.altitude,
        speed: addGpsPointDto.speed,
        recordedAt: addGpsPointDto.recordedAt
          ? new Date(addGpsPointDto.recordedAt)
          : new Date(),
      },
    });
  }

  async finishActivity(
    userId: number,
    activityId: number,
    finishActivityDto: FinishActivityDto,
  ) {
    const activity = await this.findAppTrackedActivityWithGpsPointsForUser(
      userId,
      activityId,
    );

    if (activity.status !== 'IN_PROGRESS') {
      throw new BadRequestException("L'activité n'est pas en cours.");
    }

    const endedAt = finishActivityDto.endedAt
      ? new Date(finishActivityDto.endedAt)
      : new Date();
    const startedAt =
      activity.startedAt ?? activity.gpsPoints[0]?.recordedAt ?? endedAt;

    const updatedActivity = await this.prisma.activity.update({
      where: {
        id: activityId,
      },
      data: {
        name: finishActivityDto.name ?? activity.name,
        kilometers: this.calculateKilometers(activity.gpsPoints),
        durationSeconds: this.calculateDurationSeconds(startedAt, endedAt),
        terrainType: finishActivityDto.terrainType ?? activity.terrainType,
        startedAt,
        endedAt,
        date: startedAt,
        status: 'COMPLETED',
      },
      include: {
        tires: true,
      },
    });

    this.emitActivityCompleted(updatedActivity);

    return this.serializeActivity(updatedActivity);
  }

  async cancelActivity(userId: number, activityId: number) {
    const activity = await this.findAppTrackedActivityForUser(
      userId,
      activityId,
    );

    if (activity.status !== 'IN_PROGRESS') {
      throw new BadRequestException("L'activité n'est pas en cours.");
    }

    const cancelledActivity = await this.prisma.activity.update({
      where: {
        id: activityId,
      },
      data: {
        status: 'CANCELLED',
        endedAt: new Date(),
      },
    });

    return this.serializeActivity(cancelledActivity);
  }

  private async findAppTrackedActivityForUser(
    userId: number,
    activityId: number,
  ): Promise<Activity> {
    const activity = await this.prisma.activity.findFirst({
      where: {
        id: activityId,
        userId,
        source: 'APP_TRACKED',
      },
    });

    if (!activity) {
      throw new NotFoundException(`Activity ${activityId} not found`);
    }

    return activity;
  }

  private async findAppTrackedActivityWithGpsPointsForUser(
    userId: number,
    activityId: number,
  ): Promise<ActivityWithGpsPoints> {
    const activity = await this.prisma.activity.findFirst({
      where: {
        id: activityId,
        userId,
        source: 'APP_TRACKED',
      },
      include: {
        gpsPoints: {
          orderBy: {
            recordedAt: 'asc',
          },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException(`Activity ${activityId} not found`);
    }

    return activity;
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

      const upsertedActivity = await this.prisma.activity.upsert({
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

      this.emitActivityCompleted(upsertedActivity);

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

  private calculateKilometers(points: ActivityGpsPoint[]): number {
    if (points.length < 2) {
      return 0;
    }

    let distanceInMeters = 0;

    for (let index = 1; index < points.length; index++) {
      distanceInMeters += this.calculateDistanceBetweenPoints(
        points[index - 1],
        points[index],
      );
    }

    return this.metersToKilometers(distanceInMeters);
  }

  private calculateDistanceBetweenPoints(
    pointA: ActivityGpsPoint,
    pointB: ActivityGpsPoint,
  ): number {
    const earthRadiusInMeters = 6371000;
    const latitudeA = this.degreesToRadians(pointA.latitude);
    const latitudeB = this.degreesToRadians(pointB.latitude);
    const latitudeDelta = this.degreesToRadians(
      pointB.latitude - pointA.latitude,
    );
    const longitudeDelta = this.degreesToRadians(
      pointB.longitude - pointA.longitude,
    );

    const haversine =
      Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
      Math.cos(latitudeA) *
        Math.cos(latitudeB) *
        Math.sin(longitudeDelta / 2) *
        Math.sin(longitudeDelta / 2);

    return (
      earthRadiusInMeters *
      2 *
      Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
    );
  }

  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private calculateDurationSeconds(startedAt: Date, endedAt: Date): number {
    return Math.max(
      0,
      Math.round((endedAt.getTime() - startedAt.getTime()) / 1000),
    );
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
