import type {
  TireWearScoreDetails,
  TireWearStatus,
} from 'src/tire-wear/tire-wear.service';

export type UserTireSummaryDto = {
  id: number;
  position: string | null;
  kilometers: number | null;
  smartTire: boolean | null;
  isActive: boolean | null;
  model: string;
  health: number;
  healthScore: number;
  healthStatus: TireWearStatus;
  healthDetails: TireWearScoreDetails;
  healthAlertType: 'REPLACE_SOON' | null;
};
