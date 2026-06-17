export type UserTireSummaryDto = {
  id: number;
  position: string | null;
  kilometers: number | null;
  smartTire: boolean | null;
  isActive: boolean | null;
  model: string;
  health: number;
};
