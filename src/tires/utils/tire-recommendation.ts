import {
  TerrainType,
  TireData,
  TirePerformanceProfile,
} from 'src/generated/prisma/client';
import { formatTerrainLabel } from 'src/alerts/utils/terrain-labels';

/** Nombre de recommandations affichées par défaut. */
export const DEFAULT_RECOMMENDATION_LIMIT = 3;

/** Nombre maximal de recommandations retournées. */
export const MAX_RECOMMENDATION_LIMIT = 5;

/** Écart maximal de largeur ETRTO (mm) pour les filtres stricts. */
const STRICT_MAX_WIDTH_DIFF_MM = 10;

/** Écart maximal de largeur ETRTO (mm) pour le fallback. */
const FALLBACK_MAX_WIDTH_DIFF_MM = 15;

/** Score minimum pour qu'un pneu soit retenu après le classement. */
const MIN_RECOMMENDATION_SCORE = 100;

export type TireRecommendationContext = {
  /** Catalogue complet des pneus candidats. */
  catalog: TireData[];
  /** Pneu actuellement monté sur le vélo. */
  currentTire: TireData;
  /** Terrain de l'activité ou du contexte d'alerte. */
  activityTerrain: TerrainType;
  /** Vélo électrique : exige eBikeCompatible sur les candidats. */
  isElectricBike?: boolean;
  /** Identifiant du pneu à exclure (généralement le pneu actuel). */
  excludeTireId?: number;
  /** Limite de résultats (3 par défaut, 5 max). */
  limit?: number;
};

export type ScoredTireRecommendation = {
  tire: TireData;
  score: number;
  reason: string;
  isFallback: boolean;
};

type RecommendationBikeContext = {
  isElectric: boolean;
};

/**
 * Étape 1 — Filtres stricts : le candidat doit correspondre au setup utilisateur
 * (usage, diamètre, largeur, jante, montage, e-bike, terrain).
 */
export function filterStrictCandidates(
  tires: TireData[],
  currentTire: TireData,
  activityTerrain: TerrainType,
  bike: RecommendationBikeContext,
  excludeTireId?: number,
): TireData[] {
  return tires.filter((candidate) => {
    if (excludeTireId !== undefined && candidate.id === excludeTireId) {
      return false;
    }

    const sameUsage = candidate.usageType === currentTire.usageType;

    const sameDiameter =
      candidate.etrtoDiameter !== null &&
      currentTire.etrtoDiameter !== null &&
      candidate.etrtoDiameter === currentTire.etrtoDiameter;

    const compatibleWidth =
      candidate.etrtoWidth != null &&
      currentTire.etrtoWidth != null &&
      Math.abs(candidate.etrtoWidth - currentTire.etrtoWidth) <=
        STRICT_MAX_WIDTH_DIFF_MM;

    const compatibleRim =
      candidate.rimType !== null &&
      currentTire.rimType !== null &&
      candidate.rimType === currentTire.rimType;

    const compatibleSealing =
      candidate.sealingType !== null &&
      currentTire.sealingType !== null &&
      candidate.sealingType === currentTire.sealingType;

    const compatibleEbike = !bike.isElectric || candidate.eBikeCompatible;

    const compatibleTerrain = candidate.terrainTypes.includes(activityTerrain);

    return (
      sameUsage &&
      sameDiameter &&
      compatibleWidth &&
      compatibleRim &&
      compatibleSealing &&
      compatibleEbike &&
      compatibleTerrain
    );
  });
}

/**
 * Fallback — assouplit usage, jante et montage si aucun candidat strict.
 * Conserve diamètre, largeur (±15 mm), terrain et compatibilité e-bike.
 */
export function filterFallbackCandidates(
  tires: TireData[],
  currentTire: TireData,
  activityTerrain: TerrainType,
  bike: RecommendationBikeContext,
  excludeTireId?: number,
): TireData[] {
  return tires.filter((candidate) => {
    if (excludeTireId !== undefined && candidate.id === excludeTireId) {
      return false;
    }

    const sameDiameter =
      candidate.etrtoDiameter !== null &&
      currentTire.etrtoDiameter !== null &&
      candidate.etrtoDiameter === currentTire.etrtoDiameter;

    const compatibleWidth =
      candidate.etrtoWidth != null &&
      currentTire.etrtoWidth != null &&
      Math.abs(candidate.etrtoWidth - currentTire.etrtoWidth) <=
        FALLBACK_MAX_WIDTH_DIFF_MM;

    const compatibleTerrain = candidate.terrainTypes.includes(activityTerrain);

    const compatibleEbike = !bike.isElectric || candidate.eBikeCompatible;

    return (
      sameDiameter && compatibleWidth && compatibleTerrain && compatibleEbike
    );
  });
}

/** Étape 2 — Score de pertinence : plus le score est élevé, plus le pneu est adapté. */
export function scoreTireRecommendation({
  candidate,
  currentTire,
  activityTerrain,
}: {
  candidate: TireData;
  currentTire: TireData;
  activityTerrain: TerrainType;
}): number {
  let score = 0;

  if (candidate.terrainTypes.includes(activityTerrain)) {
    score += 100;
  }

  if (candidate.usageType === currentTire.usageType) {
    score += 50;
  }

  if (
    candidate.etrtoDiameter !== null &&
    currentTire.etrtoDiameter !== null &&
    candidate.etrtoDiameter === currentTire.etrtoDiameter
  ) {
    score += 40;
  }

  const widthDiff = Math.abs(
    (candidate.etrtoWidth ?? 0) - (currentTire.etrtoWidth ?? 0),
  );

  if (widthDiff === 0) {
    score += 30;
  } else if (widthDiff <= 5) {
    score += 20;
  } else if (widthDiff <= 10) {
    score += 10;
  } else {
    score -= 30;
  }

  if (
    candidate.sealingType !== null &&
    currentTire.sealingType !== null &&
    candidate.sealingType === currentTire.sealingType
  ) {
    score += 25;
  }

  if (
    candidate.rimType !== null &&
    currentTire.rimType !== null &&
    candidate.rimType === currentTire.rimType
  ) {
    score += 20;
  }

  if (
    candidate.familyName &&
    currentTire.familyName &&
    candidate.familyName === currentTire.familyName
  ) {
    score += 10;
  }

  if (
    candidate.performanceProfiles.includes(TirePerformanceProfile.GRIP) &&
    (
      [
        TerrainType.GRAVEL,
        TerrainType.MUD,
        TerrainType.MIXED,
        TerrainType.ROCKY,
      ] as TerrainType[]
    ).includes(activityTerrain)
  ) {
    score += 15;
  }

  if (
    candidate.performanceProfiles.includes(
      TirePerformanceProfile.PUNCTURE_PROTECTION,
    ) &&
    (
      [
        TerrainType.GRAVEL,
        TerrainType.ASPHALT,
        TerrainType.ROCKY,
      ] as TerrainType[]
    ).includes(activityTerrain)
  ) {
    score += 15;
  }

  score += candidate.recommendationWeight ?? 0;

  return score;
}

/** Clé de déduplication : une variante par gamme / famille / modèle. */
export function getDeduplicationKey(tire: TireData): string {
  return tire.productRange ?? tire.familyName ?? tire.model;
}

/** Construit une raison lisible pour l'utilisateur. */
export function buildRecommendationReason(
  tire: TireData,
  currentTire: TireData,
  activityTerrain: TerrainType,
): string {
  const reasons: string[] = [];

  if (tire.terrainTypes.includes(activityTerrain)) {
    reasons.push(`adapté au terrain ${formatTerrainLabel(activityTerrain)}`);
  }

  if (
    tire.etrtoDiameter !== null &&
    currentTire.etrtoDiameter !== null &&
    tire.etrtoDiameter === currentTire.etrtoDiameter
  ) {
    reasons.push('diamètre compatible avec votre roue');
  }

  if (
    tire.etrtoWidth != null &&
    currentTire.etrtoWidth != null &&
    Math.abs(tire.etrtoWidth - currentTire.etrtoWidth) <= 5
  ) {
    reasons.push('largeur très proche de votre pneu actuel');
  }

  if (
    tire.sealingType !== null &&
    currentTire.sealingType !== null &&
    tire.sealingType === currentTire.sealingType
  ) {
    reasons.push('même type de montage');
  }

  if (reasons.length === 0) {
    return 'alternative compatible avec votre pratique';
  }

  return reasons.join(', ');
}

/**
 * Étape 3 — Score, déduplication et limitation.
 * Utilise le fallback uniquement si les filtres stricts ne donnent aucun résultat.
 */
export function recommendTires(
  context: TireRecommendationContext,
): ScoredTireRecommendation[] {
  const {
    catalog,
    currentTire,
    activityTerrain,
    isElectricBike = false,
    excludeTireId = currentTire.id,
    limit = DEFAULT_RECOMMENDATION_LIMIT,
  } = context;

  const effectiveLimit = Math.min(Math.max(1, limit), MAX_RECOMMENDATION_LIMIT);

  const bike: RecommendationBikeContext = { isElectric: isElectricBike };

  let candidates = filterStrictCandidates(
    catalog,
    currentTire,
    activityTerrain,
    bike,
    excludeTireId,
  );
  let isFallback = false;

  if (candidates.length === 0) {
    candidates = filterFallbackCandidates(
      catalog,
      currentTire,
      activityTerrain,
      bike,
      excludeTireId,
    );
    isFallback = true;
  }

  const scoredCandidates = candidates
    .map((candidate) => ({
      tire: candidate,
      score: scoreTireRecommendation({
        candidate,
        currentTire,
        activityTerrain,
      }),
    }))
    .filter((item) => item.score >= MIN_RECOMMENDATION_SCORE);

  const dedupedCandidates = Array.from(
    scoredCandidates
      .reduce((map, item) => {
        const key = getDeduplicationKey(item.tire);
        const existing = map.get(key);

        if (!existing || item.score > existing.score) {
          map.set(key, item);
        }

        return map;
      }, new Map<string, { tire: TireData; score: number }>())
      .values(),
  );

  return dedupedCandidates
    .sort((a, b) => b.score - a.score)
    .slice(0, effectiveLimit)
    .map((item) => ({
      tire: item.tire,
      score: item.score,
      reason: buildRecommendationReason(
        item.tire,
        currentTire,
        activityTerrain,
      ),
      isFallback,
    }));
}
