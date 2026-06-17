import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { randomBytes } from 'crypto';
import {
  ACTIVITY_COMPLETED,
  REFERRAL_COMPLETED,
} from '../common/events/app-events';
import type {
  ActivityCompletedEvent,
  ReferralCompletedEvent,
} from '../common/events/app-events';
import { ReferralStatus } from '../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const REFERRAL_CODE_PREFIX = 'RIDE';

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * Garantit qu'un utilisateur dispose d'un code de parrainage unique.
   * Sert aussi de backfill paresseux pour les comptes créés avant la feature.
   */
  async ensureReferralCode(userId: number): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    if (user?.referralCode) {
      return user.referralCode;
    }

    const code = await this.generateUniqueCode();

    await this.prisma.user.update({
      where: { id: userId },
      data: { referralCode: code },
    });

    return code;
  }

  /**
   * Lie un nouvel inscrit à son parrain à partir d'un code. Silencieux si le
   * code est invalide, correspond à soi-même, ou si un parrainage existe déjà.
   */
  async linkReferrer(referredId: number, code: string): Promise<void> {
    const referrer = await this.prisma.user.findUnique({
      where: { referralCode: code.trim().toUpperCase() },
      select: { id: true },
    });

    if (!referrer || referrer.id === referredId) {
      return;
    }

    const existing = await this.prisma.referral.findUnique({
      where: { referredId },
      select: { id: true },
    });

    if (existing) {
      return;
    }

    await this.prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredId,
        status: ReferralStatus.REGISTERED,
      },
    });

    this.logger.log(
      `Parrainage enregistré : parrain ${referrer.id} -> filleul ${referredId}.`,
    );
  }

  /**
   * Vue de parrainage de l'utilisateur : son code, son lien d'invitation et la
   * liste de ses filleuls avec leur statut.
   */
  async getOverview(userId: number) {
    const referralCode = await this.ensureReferralCode(userId);

    const referrals = await this.prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        referred: {
          select: { id: true, firstName: true, lastName: true, mail: true },
        },
      },
    });

    return {
      referralCode,
      referralLink: this.buildReferralLink(referralCode),
      totalReferrals: referrals.length,
      completedReferrals: referrals.filter(
        (referral) => referral.status === ReferralStatus.COMPLETED,
      ).length,
      referrals: referrals.map((referral) => ({
        id: referral.id,
        status: referral.status,
        completedAt: referral.completedAt,
        createdAt: referral.createdAt,
        filleul: referral.referred,
      })),
    };
  }

  async validateCode(code: string): Promise<{ valid: boolean }> {
    const referrer = await this.prisma.user.findUnique({
      where: { referralCode: code.trim().toUpperCase() },
      select: { id: true },
    });

    return { valid: referrer !== null };
  }

  /**
   * Valide le parrainage à la première activité terminée du filleul.
   * Idempotent : le filtre sur le statut REGISTERED empêche toute revalidation.
   */
  @OnEvent(ACTIVITY_COMPLETED)
  async handleActivityCompleted(
    payload: ActivityCompletedEvent,
  ): Promise<void> {
    const referral = await this.prisma.referral.findUnique({
      where: { referredId: payload.userId },
    });

    if (!referral || referral.status !== ReferralStatus.REGISTERED) {
      return;
    }

    const completed = await this.prisma.referral.update({
      where: { id: referral.id },
      data: { status: ReferralStatus.COMPLETED, completedAt: new Date() },
    });

    this.logger.log(
      `Parrainage ${completed.id} validé (1ère activité du filleul ${payload.userId}).`,
    );

    this.eventEmitter.emit(REFERRAL_COMPLETED, {
      referralId: completed.id,
      referrerId: completed.referrerId,
      referredId: completed.referredId,
    } satisfies ReferralCompletedEvent);
  }

  private buildReferralLink(code: string): string {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

    return `${frontendUrl}/register?ref=${code}`;
  }

  private async generateUniqueCode(): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const candidate = `${REFERRAL_CODE_PREFIX}-${randomBytes(3)
        .toString('hex')
        .toUpperCase()}`;

      const existing = await this.prisma.user.findUnique({
        where: { referralCode: candidate },
        select: { id: true },
      });

      if (!existing) {
        return candidate;
      }
    }

    throw new Error(
      'Impossible de générer un code de parrainage unique après plusieurs tentatives.',
    );
  }
}
