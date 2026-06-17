import { Injectable } from '@nestjs/common';
import {
  ReferralStatus,
  RewardStatus,
  RewardType,
} from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Agrège les données du tableau de bord influenceur : performance de
 * parrainage et commissions (en attente / versées).
 */
@Injectable()
export class InfluencerService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(userId: number) {
    const [totalReferrals, convertedReferrals, commissions] = await Promise.all(
      [
        this.prisma.referral.count({ where: { referrerId: userId } }),
        this.prisma.referral.count({
          where: { referrerId: userId, status: ReferralStatus.COMPLETED },
        }),
        this.prisma.reward.findMany({
          where: { userId, type: RewardType.COMMISSION },
          orderBy: { createdAt: 'desc' },
        }),
      ],
    );

    const pendingAmount = commissions
      .filter((commission) => commission.status === RewardStatus.AVAILABLE)
      .reduce((sum, commission) => sum + (commission.amount ?? 0), 0);

    const paidAmount = commissions
      .filter((commission) => commission.status === RewardStatus.PAID)
      .reduce((sum, commission) => sum + (commission.amount ?? 0), 0);

    return {
      referrals: {
        total: totalReferrals,
        converted: convertedReferrals,
        conversionRate:
          totalReferrals === 0
            ? 0
            : Math.round((convertedReferrals / totalReferrals) * 100),
      },
      commissions: {
        pendingAmount,
        paidAmount,
        totalAmount: pendingAmount + paidAmount,
        items: commissions,
      },
    };
  }
}
