import {
  RimType,
  SealingType,
  TerrainType,
  TireFitting,
  TirePerformanceProfile,
  TireUsageType,
} from 'src/generated/prisma/client';

export type TireDetailDto = {
  id: number;
  model: string;
  terrainTypes: TerrainType[];
  usageType: TireUsageType | null;
  wheelDiameter: string | null;
  etrtoDiameter: number | null;
  etrtoWidth: number | null;
  rimType: RimType | null;
  sealingType: SealingType | null;
  fitting: TireFitting | null;
  eBikeCompatible: boolean;
  performanceProfiles: TirePerformanceProfile[];
  familyName: string | null;
  productRange: string | null;
  tireImage: string | null;
  minPressure: number;
  maxPressure: number;
  maxKilometers: number;
};
