export type TireHealthStatus = 'good' | 'warning' | 'critical';
export type TireHealthAlertType =
  | 'PRESSURE_TOO_LOW'
  | 'PRESSURE_TOO_HIGH'
  | 'TEMPERATURE_HIGH';
export type TireHealthSeverity = 'warning' | 'critical';

export type TireHealthAnalysisResult = {
  status: TireHealthStatus;
  shouldCreateAlert: boolean;
  alertType: TireHealthAlertType | null;
  severity: TireHealthSeverity | null;
  message: string;
  recommendedAction: string;
};
