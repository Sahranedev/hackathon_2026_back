import { Inject, Injectable } from '@nestjs/common';
import { TireRule, TIRE_RULES } from './interface/tire-rule.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { Alert } from 'src/types/alerts.type';

@Injectable()
export class AlertsService {
  constructor(
    @Inject(TIRE_RULES) private readonly rules: TireRule[],
    private readonly prisma: PrismaService,
  ) {}

  async generateAlerts(tireId: number): Promise<Alert[]> {
    const userTire = await this.prisma.userTire.findUnique({
      where: { id: tireId },
      include: { tire: true },
    });

    if (!userTire?.tire) {
      throw new Error('Tire not found');
    }

    const tireData = userTire.tire;

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
    console.log('Generating all alerts');
    const userTires = await this.prisma.userTire.findMany({
      where: { tireId: { not: null } },
      select: { id: true },
    });

    await Promise.all(
      userTires.map((userTire) => this.generateAlerts(userTire.id)),
    );
  }
}
