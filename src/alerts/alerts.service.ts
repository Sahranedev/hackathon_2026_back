import { Inject, Injectable } from '@nestjs/common';
import { TireRule, TIRE_RULES } from './interface/tire-rule.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { Alert } from 'src/types/alerts.type';
import { UserTire } from 'src/generated/prisma/client';

@Injectable()
export class AlertsService {
  constructor(
    @Inject(TIRE_RULES) private readonly rules: TireRule[],
    private readonly prisma: PrismaService,
  ) {}

  async generateAlerts(userTire: UserTire): Promise<Alert[]> {
    if (!userTire.id || !userTire.tireId) {
      throw new Error('User tire not found');
    }

    const tireData = await this.prisma.tireData.findUnique({
      where: { id: userTire.tireId },
    });

    if (!tireData) {
      throw new Error('Tire data not found');
    }

    const alerts = (
      await Promise.all(
        this.rules.map((rule) =>
          Promise.resolve(rule.evaluate({ tire: userTire }, tireData)),
        ),
      )
    ).filter((alert): alert is Alert => alert !== null);
    return alerts;
  }

  async generateAllAlerts(): Promise<void> {
    const userTires = await this.prisma.userTire.findMany({
      where: { tireId: { not: null } },
    });

    await Promise.all(
      userTires.map((userTire) => this.generateAlerts(userTire)),
    );
  }

  async getUserAlerts(userId: number): Promise<Alert[]> {
    const alerts = await this.prisma.alert.findMany({
      where: { userTire: { userId } },
      select: {
        id: true,
        code: true,
        message: true,
        isChecked: true,
        metadata: true,
      },
    });

    return alerts.map((alert) => ({
      ...alert,
      metadata: (alert.metadata as Alert['metadata']) ?? null,
    }));
  }

  async getTireAlerts(userTireId: number): Promise<Alert[]> {
    const alerts = await this.prisma.alert.findMany({
      where: { userTireId },
      select: {
        id: true,
        code: true,
        message: true,
        isChecked: true,
        metadata: true,
      },
    });

    return alerts.map((alert) => ({
      ...alert,
      metadata: (alert.metadata as Alert['metadata']) ?? null,
    }));
  }

  async checkAlert(userId: number, alertId: number): Promise<Alert> {
    const alert = await this.prisma.alert.update({
      where: { id: alertId, userTire: { userId } },
      data: { isChecked: true },
    });

    return {
      id: alert.id,
      code: alert.code,
      message: alert.message,
      isChecked: alert.isChecked,
      metadata: (alert.metadata as Alert['metadata']) ?? null,
    };
  }
}
