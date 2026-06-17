import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { randomUUID } from 'crypto';
import { REFERRAL_COMPLETED, TIER_REACHED } from '../common/events/app-events';
import type {
  ReferralCompletedEvent,
  TierReachedEvent,
} from '../common/events/app-events';
import {
  AccountType,
  PointsSource,
  Reward,
  RewardStatus,
  RewardType,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  INFLUENCER_COMMISSION_AMOUNT,
  VOUCHER_VALIDITY_DAYS,
} from '../loyalty/loyalty.config';

/**
 * Catalogue des récompenses concrètes (bons de réduction et commissions).
 *
 * Le service est purement réactif : il écoute les événements métier
 * (`tier.reached`, `referral.completed`) et matérialise la récompense
 * correspondante. La génération est idempotente grâce au champ `reference`.
 */
@Injectable()
export class RewardsService {
  private readonly logger = new Logger(RewardsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findForUser(userId: number): Promise<Reward[]> {
    return this.prisma.reward.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Marque un bon de réduction comme utilisé. Vérifie l'appartenance, le statut
   * et l'expiration.
   */
  async useReward(userId: number, rewardId: number): Promise<Reward> {
    const reward = await this.prisma.reward.findFirst({
      where: { id: rewardId, userId },
    });

    if (!reward) {
      throw new NotFoundException(`Récompense ${rewardId} introuvable.`);
    }

    if (reward.type !== RewardType.DISCOUNT_VOUCHER) {
      throw new BadRequestException(
        'Seuls les bons de réduction peuvent être utilisés.',
      );
    }

    if (reward.status !== RewardStatus.AVAILABLE) {
      throw new BadRequestException("Ce bon n'est plus disponible.");
    }

    if (reward.expiresAt && reward.expiresAt < new Date()) {
      await this.prisma.reward.update({
        where: { id: reward.id },
        data: { status: RewardStatus.EXPIRED },
      });
      throw new BadRequestException('Ce bon a expiré.');
    }

    return this.prisma.reward.update({
      where: { id: reward.id },
      data: { status: RewardStatus.USED },
    });
  }

  @OnEvent(TIER_REACHED)
  async onTierReached(payload: TierReachedEvent): Promise<void> {
    const reference = `tier:${payload.userId}:${payload.tierName}`;

    if (await this.alreadyGranted(reference)) {
      return;
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + VOUCHER_VALIDITY_DAYS);

    await this.prisma.reward.create({
      data: {
        userId: payload.userId,
        type: RewardType.DISCOUNT_VOUCHER,
        source: PointsSource.TIER,
        code: this.generateCode('TIER'),
        discountPercent: payload.voucher.discountPercent,
        category: payload.voucher.category,
        reference,
        expiresAt,
      },
    });

    this.logger.log(
      `Bon ${payload.voucher.discountPercent}% (${payload.voucher.category}) généré pour l'utilisateur ${payload.userId} (palier ${payload.tierName}).`,
    );
  }

  @OnEvent(REFERRAL_COMPLETED)
  async onReferralCompleted(payload: ReferralCompletedEvent): Promise<void> {
    const referrer = await this.prisma.user.findUnique({
      where: { id: payload.referrerId },
      select: { accountType: true },
    });

    if (referrer?.accountType !== AccountType.INFLUENCER) {
      return;
    }

    const reference = `commission:referral:${payload.referralId}`;

    if (await this.alreadyGranted(reference)) {
      return;
    }

    await this.prisma.reward.create({
      data: {
        userId: payload.referrerId,
        type: RewardType.COMMISSION,
        source: PointsSource.REFERRAL,
        code: this.generateCode('COMM'),
        amount: INFLUENCER_COMMISSION_AMOUNT,
        reference,
      },
    });

    this.logger.log(
      `Commission de ${INFLUENCER_COMMISSION_AMOUNT} générée pour l'influenceur ${payload.referrerId} (parrainage ${payload.referralId}).`,
    );
  }

  private async alreadyGranted(reference: string): Promise<boolean> {
    const existing = await this.prisma.reward.findFirst({
      where: { reference },
      select: { id: true },
    });

    return existing !== null;
  }

  private generateCode(prefix: string): string {
    return `${prefix}-${randomUUID().slice(0, 8).toUpperCase()}`;
  }
}
