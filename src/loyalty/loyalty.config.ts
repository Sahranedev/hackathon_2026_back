/**
 * Paramètres métier du programme de fidélité.
 *
 * Centralisés ici pour rester facilement ajustables sans toucher à la logique
 * (taux, barèmes, paliers). Toute la chaîne points -> paliers -> bons s'appuie
 * sur ces constantes.
 */

export const POINTS_PER_KILOMETER = 1;

export const REFERRAL_POINTS = {
  referrer: 100,
  referred: 50,
} as const;

/**
 * Montant forfaitaire (dans la devise de l'application) versé à un influenceur
 * pour chaque filleul validé. Les influenceurs sont rémunérés en commission
 * plutôt qu'en points.
 */
export const INFLUENCER_COMMISSION_AMOUNT = 5;

/**
 * Durée de validité d'un bon de réduction généré par un palier (en jours).
 */
export const VOUCHER_VALIDITY_DAYS = 90;

/**
 * Catégorie spéciale signifiant que le bon s'applique à toutes les catégories.
 */
export const ALL_CATEGORIES = 'ALL';

export interface TierVoucher {
  discountPercent: number;
  category: string;
}

export interface LoyaltyTier {
  name: string;
  minPoints: number;
  voucher?: TierVoucher;
}

/**
 * Paliers de fidélité, triés par seuil croissant. Le premier palier (BRONZE)
 * sert de niveau d'entrée sans récompense. Atteindre un palier doté d'un
 * `voucher` déclenche la génération d'un bon de réduction.
 */
export const LOYALTY_TIERS: LoyaltyTier[] = [
  { name: 'BRONZE', minPoints: 0 },
  {
    name: 'SILVER',
    minPoints: 500,
    voucher: { discountPercent: 10, category: 'ROAD' },
  },
  {
    name: 'GOLD',
    minPoints: 1500,
    voucher: { discountPercent: 15, category: ALL_CATEGORIES },
  },
  {
    name: 'PLATINUM',
    minPoints: 4000,
    voucher: { discountPercent: 20, category: ALL_CATEGORIES },
  },
];

/**
 * Retourne le palier le plus élevé atteint pour un nombre de points donné.
 */
export function resolveTier(points: number): LoyaltyTier {
  let current = LOYALTY_TIERS[0];

  for (const tier of LOYALTY_TIERS) {
    if (points >= tier.minPoints) {
      current = tier;
    }
  }

  return current;
}

/**
 * Retourne tous les paliers nouvellement franchis en passant de `fromPoints`
 * à `toPoints` (utile pour générer les bons des paliers traversés).
 */
export function tiersCrossed(
  fromPoints: number,
  toPoints: number,
): LoyaltyTier[] {
  return LOYALTY_TIERS.filter(
    (tier) =>
      tier.minPoints > 0 &&
      fromPoints < tier.minPoints &&
      toPoints >= tier.minPoints,
  );
}
