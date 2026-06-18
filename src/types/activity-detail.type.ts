import { ActivitySource, ActivityStatus, TerrainType } from '../generated/prisma/client';

export type ActivityTireSummary = {
  userTireId: number;
  name: string;
  position: string | null;
};

export type ActivityDetail = {
  id: number;
  userId: number;
  stravaActivityId: string | null;
  name: string | null;
  source: ActivitySource;
  status: ActivityStatus;
  startPosition: number | null;
  kilometers: number | null;
  durationSeconds: number | null;
  terrainType: TerrainType;
  startedAt: string | null;
  endedAt: string | null;
  date: string | null;
  createdAt: string;
  updatedAt: string;
  tires: ActivityTireSummary[];
};
