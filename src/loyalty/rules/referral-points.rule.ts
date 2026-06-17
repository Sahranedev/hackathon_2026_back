import { Injectable } from '@nestjs/common';
import {
  REFERRAL_COMPLETED,
  ReferralCompletedEvent,
} from '../../common/events/app-events';
import { AccountType, PointsSource } from '../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { REFERRAL_POINTS } from '../loyalty.config';
import { PointsRule } from '../interfaces/points-rule.interface';
import { LoyaltyService } from '../loyalty.service';
import { PointsService } from '../points.service';

/**
 * Attribue les points de parrainage lorsqu'un filleul est validé.
 *
 * Seuls les parrains STANDARD sont récompensés en points ; les influenceurs
 * sont rémunérés en commission (gérée par le `RewardsModule` qui écoute le même
 * événement). Le filleul reçoit ses points dans tous les cas.
 */
@Injectable()
export class ReferralPointsRule implements PointsRule<ReferralCompletedEvent> {
  readonly code = 'REFERRAL_POINTS';
  readonly event = REFERRAL_COMPLETED;

  constructor(
    private readonly prisma: PrismaService,
    private readonly pointsService: PointsService,
    private readonly loyaltyService: LoyaltyService,
  ) {}

  async handle(payload: ReferralCompletedEvent): Promise<void> {
    const referrer = await this.prisma.user.findUnique({
      where: { id: payload.referrerId },
      select: { accountType: true },
    });

    if (referrer?.accountType === AccountType.STANDARD) {
      await this.awardPoints(
        payload.referrerId,
        REFERRAL_POINTS.referrer,
        `referral:${payload.referralId}:referrer`,
      );
    }

    await this.awardPoints(
      payload.referredId,
      REFERRAL_POINTS.referred,
      `referral:${payload.referralId}:referred`,
    );
  }

  private async awardPoints(
    userId: number,
    amount: number,
    reference: string,
  ): Promise<void> {
    const result = await this.pointsService.award(
      userId,
      amount,
      PointsSource.REFERRAL,
      reference,
    );

    if (result) {
      await this.loyaltyService.refreshTier(userId, result.previousPoints);
    }
  }
}
