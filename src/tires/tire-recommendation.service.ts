import { Injectable } from '@nestjs/common';
import { TerrainType, TireData } from 'src/generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  DEFAULT_RECOMMENDATION_LIMIT,
  MAX_RECOMMENDATION_LIMIT,
  recommendTires,
  ScoredTireRecommendation,
} from './utils/tire-recommendation';

export type RecommendTiresOptions = {
  currentTire: TireData;
  activityTerrain: TerrainType;
  isElectricBike?: boolean;
  excludeTireId?: number;
  limit?: number;
};

@Injectable()
export class TireRecommendationService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Recommande des pneus à partir du catalogue complet.
   * Applique filtres stricts, scoring, déduplication et fallback si besoin.
   */
  async recommend(
    options: RecommendTiresOptions,
  ): Promise<ScoredTireRecommendation[]> {
    const catalog = await this.prisma.tireData.findMany();
    const limit = Math.min(
      options.limit ?? DEFAULT_RECOMMENDATION_LIMIT,
      MAX_RECOMMENDATION_LIMIT,
    );

    return recommendTires({
      catalog,
      currentTire: options.currentTire,
      activityTerrain: options.activityTerrain,
      isElectricBike: options.isElectricBike,
      excludeTireId: options.excludeTireId,
      limit,
    });
  }
}
