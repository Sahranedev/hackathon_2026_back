import { Injectable } from '@nestjs/common';
import {
  ACTIVITY_COMPLETED,
  ActivityCompletedEvent,
} from '../../common/events/app-events';
import { PointsSource } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { POINTS_PER_KILOMETER } from '../loyalty.config';
import { PointsRule } from '../interfaces/points-rule.interface';
import { LoyaltyService } from '../loyalty.service';
import { PointsService } from '../points.service';

/**
 * Attribue des points en fonction de la distance parcourue lors d'une activité.
 *
 * Robuste face aux re-synchronisations Strava : seul le delta de kilomètres non
 * encore récompensés (`Activity.rewardedKilometers`) est crédité, ce qui évite
 * tout double comptage quand une activité est mise à jour.
 */
@Injectable()
export class KilometersPointsRule implements PointsRule<ActivityCompletedEvent> {
  readonly code = 'KILOMETERS_POINTS';
  readonly event = ACTIVITY_COMPLETED;

  constructor(
    private readonly prisma: PrismaService,
    private readonly pointsService: PointsService,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  async handle(payload: ActivityCompletedEvent): Promise<void> {
    const activity = await this.prisma.activity.findUnique({
      where: { id: payload.activityId },
      select: { kilometers: true, rewardedKilometers: true, userId: true },
    });

    if (!activity) {
      return;
    }

    const totalKilometers = Math.floor(activity.kilometers ?? 0);
    const alreadyRewarded = Math.floor(activity.rewardedKilometers ?? 0);
    const deltaKilometers = totalKilometers - alreadyRewarded;

    if (deltaKilometers <= 0) {
      return;
    }

    const amount = deltaKilometers * POINTS_PER_KILOMETER;

    const result = await this.pointsService.award(
      activity.userId,
      amount,
      PointsSource.KILOMETERS,
      `activity:${payload.activityId}:km:${totalKilometers}`,
    );

    await this.prisma.activity.update({
      where: { id: payload.activityId },
      data: { rewardedKilometers: totalKilometers },
    });

    if (result) {
      await this.loyaltyService.refreshTier(
        activity.userId,
        result.previousPoints,
      );
    }
  }
}
