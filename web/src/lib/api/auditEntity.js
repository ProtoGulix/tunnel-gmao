/**
 * Correspondance préfixe d'URL → entity_type d'audit (miroir du _ENTITY_MAP du backend).
 * Fichier sans dépendance : testé directement par node --test.
 */

const URL_ENTITY_MAP = {
  'intervention-actions': 'action',
  'intervention-requests': 'request',
  'intervention-tasks': 'task',
  'interventions': 'intervention',
  'purchase-requests': 'purchase_request',
  'supplier-orders': 'supplier_order',
  'equipements': 'equipement',
  'preventive-occurrences': 'preventive_occurrence',
};

export function getAuditEntityType(error) {
  const url = error?.config?.url ?? '';
  const segment = url.replace(/^\//, '').split('/')[0];
  return URL_ENTITY_MAP[segment] ?? null;
}

/** Décision d'audit attendue par la requête : une suppression exige un motif « deleted ». */
export function getAuditDecisionType(error) {
  return String(error?.config?.method ?? '').toLowerCase() === 'delete' ? 'deleted' : undefined;
}
