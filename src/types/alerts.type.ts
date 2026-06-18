import { UserTire } from 'src/generated/prisma/client';

export type RecommendedTireSummary = {
  id: number;
  model: string;
  reason: string;
  isFallback: boolean;
};

export type AlertMetadata = {
  recommendedTires?: RecommendedTireSummary[];
  slowLeak?: {
    lastCheckedReadingCount?: number;
  };
  tireHealth?: {
    healthScore?: number;
    healthStatus?: string;
    mileageKm?: number;
    mileagePenalty?: number;
    underInflatedCount?: number;
    underInflationPenalty?: number;
    usagePenalty?: number;
    tireProductName?: string;
  };
};

export type Alert = {
  id: number;
  userTireId: number;
  code: string;
  message: string;
  isChecked: boolean;
  metadata?: AlertMetadata | null;
};

export type RuleContext = {
  tire: UserTire;
};
