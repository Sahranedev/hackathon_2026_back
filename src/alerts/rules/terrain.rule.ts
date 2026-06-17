import { Injectable } from '@nestjs/common';
import { TerrainType, TireData } from 'src/generated/prisma/client';
import { Alert, RuleContext } from 'src/types/alerts.type';
import { TireRecommendationService } from 'src/tires/tire-recommendation.service';
import { TireRule } from '../interface/tire-rule.interface';
import { PrismaService } from 'src/prisma/prisma.service';
import { AlertPersistenceService } from '../alert-persistence.service';
import { formatTerrainList } from '../utils/terrain-labels';

const RECENT_ACTIVITIES_LIMIT = 5;

@Injectable()
export class TerrainRule implements TireRule {
  constructor(
    private readonly prisma: PrismaService,
    private readonly alertPersistence: AlertPersistenceService,
    private readonly tireRecommendation: TireRecommendationService,
  ) {}
  code = 'TERRAIN';

  async evaluate(ctx: RuleContext, tire: TireData): Promise<Alert | null> {
    const recentActivities = await this.prisma.activity.findMany({
      where: {
        tires: {
          some: {
            tireId: ctx.tire.id,
          },
        },
        terrainType: { not: TerrainType.UNKNOWN },
      },
      orderBy: { date: 'desc' },
      take: RECENT_ACTIVITIES_LIMIT,
      select: { terrainType: true },
    });

    const recentTerrainTypes: TerrainType[] = [];
    const seenTerrains = new Set<TerrainType>();

    for (const { terrainType } of recentActivities) {
      if (!seenTerrains.has(terrainType)) {
        seenTerrains.add(terrainType);
        recentTerrainTypes.push(terrainType);
      }
    }

    const unsupportedTerrains = recentTerrainTypes.filter(
      (terrain) => !tire.terrainTypes.includes(terrain),
    );

    if (unsupportedTerrains.length === 0) {
      return null;
    }

    // Terrain le plus récent non supporté : base de la recommandation ciblée
    const primaryTerrain = unsupportedTerrains[0];

    const recommendations = await this.tireRecommendation.recommend({
      currentTire: tire,
      activityTerrain: primaryTerrain,
      excludeTireId: tire.id,
    });

    const terrainList = formatTerrainList(unsupportedTerrains);

    const message = `Votre pneu ${tire.model} n'est pas compatible avec le type de terrain récent (${terrainList}).`;

    const alert = await this.alertPersistence.createAlert(
      ctx.tire.id,
      this.code,
      message,
      {
        recommendedTires: recommendations.map((rec) => ({
          id: rec.tire.id,
          model: rec.tire.model,
          reason: rec.reason,
          isFallback: rec.isFallback,
        })),
      },
    );
    if (alert) {
      return alert;
    }

    return null;
  }
}
