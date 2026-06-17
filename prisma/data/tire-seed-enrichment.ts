import {
  RimType,
  SealingType,
  TerrainType,
  TireFitting,
  TirePerformanceProfile,
  TireUsageType,
} from '../../src/generated/prisma/client';
import { TireSeed } from './michelin-tires';

/** Diamètre ETRTO standard pour une roue exprimée en pouces (ex. 28" → 622). */
const WHEEL_INCH_TO_ETRTO: Record<string, number> = {
  '28': 622,
  '29': 622,
  '27.5': 584,
  '26': 559,
};

const GRIP_TERRAINS: TerrainType[] = [
  TerrainType.GRAVEL,
  TerrainType.MUD,
  TerrainType.MIXED,
  TerrainType.ROCKY,
  TerrainType.SOFT,
];

const PUNCTURE_TERRAINS: TerrainType[] = [
  TerrainType.GRAVEL,
  TerrainType.ASPHALT,
  TerrainType.ROCKY,
  TerrainType.MIXED,
];

/**
 * Extrait largeur et diamètre ETRTO depuis le libellé modèle Michelin.
 * Formats supportés : "28-622 (700X28C)", "28"-25mm", "55/100-584 (27.5x2.20)".
 */
function parseEtrtoFromModel(model: string): {
  etrtoWidth: number | null;
  etrtoDiameter: number | null;
  wheelDiameter: string | null;
} {
  const etrtoMatch = model.match(/^(\d+)(?:\/\d+)?-(\d{3})\b/i);
  if (etrtoMatch) {
    return {
      etrtoWidth: Number.parseInt(etrtoMatch[1], 10),
      etrtoDiameter: Number.parseInt(etrtoMatch[2], 10),
      wheelDiameter: inferWheelDiameterFromEtrto(
        Number.parseInt(etrtoMatch[2], 10),
        model,
      ),
    };
  }

  const tubularMatch = model.match(/^(\d+(?:\.\d+)?)"-(\d+)mm/i);
  if (tubularMatch) {
    const wheelInch = tubularMatch[1];
    return {
      etrtoWidth: Number.parseInt(tubularMatch[2], 10),
      etrtoDiameter: WHEEL_INCH_TO_ETRTO[wheelInch] ?? 622,
      wheelDiameter: `${wheelInch}"`,
    };
  }

  return { etrtoWidth: null, etrtoDiameter: null, wheelDiameter: null };
}

function inferWheelDiameterFromEtrto(
  etrtoDiameter: number,
  model: string,
): string | null {
  const lower = model.toLowerCase();
  if (lower.includes('650b') || lower.includes('27.5')) return '27.5"';
  if (lower.includes('26x') || etrtoDiameter === 559) return '26"';
  if (lower.includes('700') || etrtoDiameter === 622) return '28"';
  if (etrtoDiameter === 584) return '27.5"';
  return null;
}

function inferRimAndSealing(model: string): {
  rimType: RimType;
  sealingType: SealingType;
} {
  const upper = model.toUpperCase();

  if (upper.includes('TUBULAR')) {
    return { rimType: RimType.TUBULAR, sealingType: SealingType.TUBE };
  }

  if (upper.includes('TLR') || upper.includes('TUBELESS')) {
    return {
      rimType: RimType.TUBELESS,
      sealingType: upper.includes('TLR')
        ? SealingType.TUBELESS_READY
        : SealingType.TUBELESS,
    };
  }

  return { rimType: RimType.CLINCHER, sealingType: SealingType.TUBE };
}

function inferUsageType(model: string, terrains: TerrainType[]): TireUsageType {
  const upper = model.toUpperCase();

  if (
    upper.includes('E-BIKE') ||
    upper.includes('EBIKE') ||
    upper.includes('E BIKE')
  ) {
    return TireUsageType.E_BIKE;
  }
  if (
    upper.includes('CITY') ||
    upper.includes('URBAN') ||
    upper.includes('STREET')
  ) {
    return TireUsageType.CITY;
  }
  if (upper.includes('TOURING') || upper.includes('TREKKING')) {
    return TireUsageType.TOURING;
  }
  if (
    upper.includes('COMMUT') ||
    upper.includes('CARGO') ||
    upper.includes('DELIVERY')
  ) {
    return TireUsageType.COMMUTING;
  }
  if (
    upper.includes('MTB') ||
    upper.includes('WILD') ||
    upper.includes('DOWNHILL') ||
    upper.includes('ENDURO')
  ) {
    return TireUsageType.MTB;
  }
  if (
    upper.includes('GRAVEL') ||
    upper.includes('CYCLOCROSS') ||
    upper.includes('ADVENTURE') ||
    terrains.includes(TerrainType.GRAVEL)
  ) {
    return TireUsageType.GRAVEL;
  }

  return TireUsageType.ROAD;
}

/** Extrait la gamme produit (ex. "POWER GRAVEL", "POWER CUP"). */
function extractProductRange(model: string): {
  productRange: string | null;
  familyName: string | null;
} {
  const rangeMatch = model.match(
    /\b(POWER\s+[A-Z][A-Z\s]+?)(?:\s+(?:BLACK|CLASSIC|TLR|TUBULAR|S RACING|RACING LINE|COMPETITION LINE|WIRE BEAD|FOLDABLE BEAD)|\s*$)/i,
  );

  if (!rangeMatch) {
    const cityMatch = model.match(/\b(CITY\s+[A-Z]+(?:\s+[A-Z]+)?)/i);
    if (cityMatch) {
      const range = cityMatch[1].trim().toUpperCase();
      return { productRange: range, familyName: range };
    }
    return { productRange: null, familyName: null };
  }

  const range = rangeMatch[1].trim().replace(/\s+/g, ' ').toUpperCase();
  return { productRange: range, familyName: range };
}

function inferPerformanceProfiles(
  model: string,
  terrains: TerrainType[],
): TirePerformanceProfile[] {
  const upper = model.toUpperCase();
  const profiles = new Set<TirePerformanceProfile>();

  if (upper.includes('PROTECTION') || upper.includes('COMPETITION LINE')) {
    profiles.add(TirePerformanceProfile.PUNCTURE_PROTECTION);
  }
  if (upper.includes('COMFORT') || upper.includes('TOURING')) {
    profiles.add(TirePerformanceProfile.COMFORT);
  }
  if (
    upper.includes('CUP') ||
    upper.includes('TIME TRIAL') ||
    upper.includes('JET')
  ) {
    profiles.add(TirePerformanceProfile.SPEED);
  }
  if (upper.includes('MUD') || upper.includes('GRIP')) {
    profiles.add(TirePerformanceProfile.GRIP);
  }
  if (terrains.some((t) => GRIP_TERRAINS.includes(t))) {
    profiles.add(TirePerformanceProfile.GRIP);
  }
  if (terrains.some((t) => PUNCTURE_TERRAINS.includes(t))) {
    profiles.add(TirePerformanceProfile.DURABILITY);
  }

  return Array.from(profiles);
}

function inferFitting(model: string): TireFitting {
  const upper = model.toUpperCase();
  if (upper.includes('FRONT') && !upper.includes('REAR')) {
    return TireFitting.FRONT;
  }
  if (upper.includes('REAR') && !upper.includes('FRONT')) {
    return TireFitting.REAR;
  }
  return TireFitting.FRONT_REAR;
}

function inferRecommendationWeight(model: string): number {
  const upper = model.toUpperCase();
  if (upper.includes('RACING LINE') || upper.includes('COMPETITION LINE')) {
    return 5;
  }
  if (upper.includes('PROTECTION') || upper.includes('ADVENTURE')) {
    return 3;
  }
  return 0;
}

function isEBikeCompatible(model: string, usageType: TireUsageType): boolean {
  const upper = model.toUpperCase();
  return (
    usageType === TireUsageType.E_BIKE ||
    upper.includes('E-BIKE') ||
    upper.includes('EBIKE') ||
    upper.includes('CARGO') ||
    upper.includes('CITY')
  );
}

/** Enrichit un pneu seed avec les attributs de filtrage / scoring. */
export function enrichTireSeed(seed: TireSeed) {
  const { etrtoWidth, etrtoDiameter, wheelDiameter } = parseEtrtoFromModel(
    seed.model,
  );
  const { rimType, sealingType } = inferRimAndSealing(seed.model);
  const usageType = inferUsageType(seed.model, seed.terrainTypes);
  const { productRange, familyName } = extractProductRange(seed.model);

  return {
    ...seed,
    usageType,
    wheelDiameter,
    etrtoDiameter,
    etrtoWidth,
    rimType,
    sealingType,
    fitting: inferFitting(seed.model),
    eBikeCompatible: isEBikeCompatible(seed.model, usageType),
    performanceProfiles: inferPerformanceProfiles(
      seed.model,
      seed.terrainTypes,
    ),
    familyName,
    productRange,
    recommendationWeight: inferRecommendationWeight(seed.model),
  };
}
