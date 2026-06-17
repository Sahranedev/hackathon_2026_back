/**
 * Contrat d'une règle d'attribution de points (pattern Strategy), calqué sur le
 * moteur d'alertes (`TIRE_RULES`). Chaque règle réagit à un événement applicatif
 * précis et applique sa logique d'attribution de manière idempotente.
 */

export const POINTS_RULES = Symbol('POINTS_RULES');

export interface PointsRule<TPayload = unknown> {
  /** Identifiant lisible de la règle (pour le logging/débogage). */
  readonly code: string;
  /** Nom de l'événement applicatif que la règle écoute. */
  readonly event: string;
  /** Applique la règle pour la charge utile de l'événement. */
  handle(payload: TPayload): Promise<void>;
}
