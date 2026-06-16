import { Injectable } from '@nestjs/common';
import { TireData } from 'src/generated/prisma/client';
import { Alert, RuleContext } from 'src/types/alerts.type';
import { TireRule } from '../interface/tire-rule.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { AlertPersistenceService } from '../alert-persistence.service';

@Injectable()
export class TerrainRule implements TireRule {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alertPersistence: AlertPersistenceService,
  ) {}
  code = 'TERRAIN';

  async evaluate(ctx: RuleContext, tire: TireData): Promise<Alert | null> {
    const lastActivity = await this.prisma.activity.findFirst({
      where: {
        tires: {
          some: {
            tireId: ctx.tire.id,
          },
        },
      },
      orderBy: { date: 'desc' },
      include: {
        tires: {
          include: {
            tire: {
              include: { tire: true },
            },
          },
        },
      },
    });

    const lastTerrainTypes = (lastActivity?.tires ?? []).flatMap(
      (activityTire) => activityTire.tire.tire?.terrainTypes ?? [],
    );

    const recommendedTerrainTypes = tire.terrainTypes;

    if (
      lastTerrainTypes.length > 0 &&
      lastTerrainTypes.some(
        (terrain) => !recommendedTerrainTypes.includes(terrain),
      )
    ) {
      console.log(
        `Tire ${tire.model} not adapted to terrain ${lastTerrainTypes.join(', ')}`,
      );
      const alert = await this.alertPersistence.createAlert(
        ctx.tire.id,
        this.code,
        'Not adapted to terrain',
      );
      if (alert) {
        return alert;
      }
    }

    return null;
  }
}
