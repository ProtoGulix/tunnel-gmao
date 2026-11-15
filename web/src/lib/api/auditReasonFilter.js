/**
 * Filtre des motifs d'audit selon la décision (decision_types du motif).
 * Un motif sans decision_types n'est proposé pour aucune décision filtrée (ADR 0016).
 */

export const DECISION_DELETED = 'deleted';

// Catégories qu'un utilisateur peut choisir : 'auto' est posé par les règles routinières,
// 'system' est réservé aux mutations du système (refusé par le middleware pour un utilisateur).
const SELECTABLE_CATEGORIES = new Set(['manual', 'user']);

/**
 * Motifs proposables à l'utilisateur dans la fenêtre de motif.
 * @param {Array<{category?: string}>} reasons
 */
export function selectableReasons(reasons) {
  if (!Array.isArray(reasons)) return [];
  return reasons.filter((r) => SELECTABLE_CATEGORIES.has(r.category));
}

/**
 * @param {Array<{decision_types?: string[]|null}>} reasons
 * @param {string} [decisionType] - sans valeur, la liste est rendue telle quelle
 */
export function filterReasonsByDecision(reasons, decisionType) {
  if (!decisionType || !Array.isArray(reasons)) return reasons;
  return reasons.filter(
    (r) => Array.isArray(r.decision_types) && r.decision_types.includes(decisionType)
  );
}
