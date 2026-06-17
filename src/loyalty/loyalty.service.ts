import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TIER_REACHED, TierReachedEvent } from '../common/events/app-events';
import { PrismaService } from '../prisma/prisma.service';
import { resolveTier, tiersCrossed } from './loyalty.config';

/**
 * Gère la progression dans les paliers de fidélité.
 *
 * Après chaque crédit de points, `refreshTier` recalcule le palier courant et
 * émet un événement `tier.reached` pour chaque palier doté d'un bon nouvellement
 * franchi. La génération effective des bons relève du `RewardsModule`, ce qui
 * garde ce service focalisé sur la seule logique de paliers.
 */
@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Recalcule le palier de l'utilisateur à partir de son solde de points.
   *
   * @param previousPoints solde avant le dernier crédit (pour détecter les
   *   paliers franchis). Si omis, aucun palier n'est considéré comme franchi.
   */
  async refreshTier(userId: number, previousPoints?: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { points: true, currentTier: true },
    });

    if (!user) {
      return;
    }

    const resolved = resolveTier(user.points);

    if (resolved.name !== user.currentTier) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { currentTier: resolved.name },
      });
    }

    if (previousPoints === undefined) {
      return;
    }

    for (const tier of tiersCrossed(previousPoints, user.points)) {
      if (!tier.voucher) {
        continue;
      }

      this.logger.log(
        `Utilisateur ${userId} a atteint le palier ${tier.name}.`,
      );

      this.eventEmitter.emit(TIER_REACHED, {
        userId,
        tierName: tier.name,
        voucher: tier.voucher,
      } satisfies TierReachedEvent);
    }
  }
}
