import { UserTire } from 'src/generated/prisma/client';

export type RecommendedTireSummary = {
  id: number;
  model: string;
  reason: string;
  isFallback: boolean;
};

export type AlertMetadata = {
  recommendedTires?: RecommendedTireSummary[];
};

export type Alert = {
  id: number;
  code: string;
  message: string;
  isChecked: boolean;
  metadata?: AlertMetadata | null;
};

export type RuleContext = {
  tire: UserTire;
};
