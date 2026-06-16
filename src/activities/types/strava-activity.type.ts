export type StravaActivity = {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  start_date: string;
  type?: string;
  sport_type?: string;
  trainer?: boolean;
};
