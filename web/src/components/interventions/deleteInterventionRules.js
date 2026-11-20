/**
 * Règles d'affichage de la suppression d'une intervention (ADR 0019).
 * Aide à l'écran seulement : le backend refuse de toute façon (400) ce qui n'est pas permis.
 */

export const OUTCOME_REOPEN = 'reopen';
export const OUTCOME_DELETE = 'delete';

/**
 * Raison pour laquelle la suppression est impossible, ou null si elle est proposée.
 * @param {Object} intervention - détail mappé (isLocked venu de l'API, stats, request)
 */
export function getDeleteBlockReason(intervention) {
  if (intervention?.isLocked !== false) {
    return "Impossible : l'intervention est fermée";
  }
  const stats = intervention?.stats ?? {};
  if (stats.actionCount || stats.purchaseCount) {
    return "Impossible : l'intervention a des actions ou des achats";
  }
  return null;
}

/**
 * Issues proposées pour la demande liée.
 * Sans demande (intervention ancienne) : aucun choix, aucun paramètre à envoyer.
 * Demande système (préventif) : la suppression en cascade est désactivée avec explication.
 */
export function getRequestOutcomeOptions(request) {
  if (!request) return { needsChoice: false, canDeleteRequest: false, deleteRequestHint: null };
  if (request.isSystem) {
    return {
      needsChoice: true,
      canDeleteRequest: false,
      deleteRequestHint:
        'Impossible : la demande vient du préventif. Rouvrez-la, elle repart dans le planning préventif.',
    };
  }
  return { needsChoice: true, canDeleteRequest: true, deleteRequestHint: null };
}

/** Paramètres de DELETE /interventions/{id}, sans paramètre quand il n'y a pas de demande. */
export function buildDeleteParams(request, outcome) {
  return request && outcome ? { request_outcome: outcome } : undefined;
}
