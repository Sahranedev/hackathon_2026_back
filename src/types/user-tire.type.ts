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

export type UserTireInfoDto = {
  id: number;
  kilometers: number | null;
  lastPressureBar: number | null;
  smartTire: boolean | null;
};

export type UserTireWearDto = {
  id: number;
  model: string;
  position: string | null;
  healthScore: number;
  healthStatus: TireWearStatus;
};
