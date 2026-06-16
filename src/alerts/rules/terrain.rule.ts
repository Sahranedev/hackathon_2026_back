import { Injectable } from '@nestjs/common';
import { TireData } from 'src/generated/prisma/client';
import { Alert, RuleContext } from 'src/types/alerts.type';
import { TireRule } from '../interface/tire-rule.interface';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class TerrainRule implements TireRule {
  constructor(private readonly prisma: PrismaService) {}
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
      return {
        code: this.code,
        severity: 'high',
        message: 'Non adapté au terrain',
      };
    }

    return null;
  }
}
