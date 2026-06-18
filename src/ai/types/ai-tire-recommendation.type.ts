import {
  TerrainType,
  TireUsageType,
  TirePerformanceProfile,
} from 'src/generated/prisma/client';

export type AiRecommendedTire = {
  id: number;
  model: string;
  reason: string;
  terrainTypes: TerrainType[];
  usageType: TireUsageType | null;
  familyName: string | null;
  productRange: string | null;
  performanceProfiles: TirePerformanceProfile[];
};

export type AiTireRecommendationResponse = {
  recommendations: AiRecommendedTire[];
};
