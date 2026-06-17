export type TireHealthStatus = 'good' | 'warning' | 'critical';
export type TireHealthAlertType =
  | 'PRESSURE_TOO_LOW'
  | 'PRESSURE_TOO_HIGH'
  | 'ABNORMAL_PRESSURE_DROP'
  | 'SLOW_LEAK_SUSPECTED';
export type TireHealthSeverity = 'warning' | 'critical';

export type TireHealthAnalysisResult = {
  status: TireHealthStatus;
  shouldCreateAlert: boolean;
  alertType: TireHealthAlertType | null;
  severity: TireHealthSeverity | null;
  message: string;
  recommendedAction: string;
};
