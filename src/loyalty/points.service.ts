import { Injectable, Logger } from '@nestjs/common';
import { PointsSource, Prisma } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Registre des points : seule porte d'entrée pour créditer des points.
 *
 * L'idempotence est garantie par la contrainte d'unicité sur `reference`
 * (ex. `activity:42`, `referral:7`) : un même événement métier ne peut pas
 * créditer deux fois. Le solde `User.points` est le cumul à vie, qui détermine
 * le palier de fidélité.
 */
@Injectable()
export class PointsService {
  private readonly logger = new Logger(PointsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crédite `amount` points à un utilisateur pour un événement identifié par
   * `reference`. Retourne le solde de points avant/après si l'opération a été
   * appliquée, ou `null` si elle avait déjà été enregistrée (idempotence).
   */
  async award(
    userId: number,
    amount: number,
    source: PointsSource,
    reference: string,
  ): Promise<{ previousPoints: number; newPoints: number } | null> {
    if (amount <= 0) {
      return null;
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.pointsTransaction.create({
          data: { userId, amount, source, reference },
        });

        const user = await tx.user.update({
          where: { id: userId },
          data: { points: { increment: amount } },
          select: { points: true },
        });

        return {
          previousPoints: user.points - amount,
          newPoints: user.points,
        };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        this.logger.debug(
          `Points déjà attribués pour la référence "${reference}", opération ignorée.`,
        );
        return null;
      }

      throw error;
    }
  }
}
