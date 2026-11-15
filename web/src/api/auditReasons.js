/**
 * Audit Reasons API
 *
 * Cache session par entity_type — la liste est stable dans une session.
 */

import { api } from '@/lib/api/client';
import { selectableReasons } from '@/lib/api/auditReasonFilter';

const _cache = {};

/**
 * @param {'intervention'|'request'|'purchase_request'|'task'|'action'|'supplier_order'|'equipement'|'preventive_occurrence'} entityType
 * @returns {Promise<Array<{code: string, label: string, color: string}>>}
 */
export async function fetchAuditReasons(entityType) {
  if (_cache[entityType]) return _cache[entityType];

  // Toutes catégories, puis filtre : les motifs « user » (OTHER, motifs de clôture et de
  // suppression) étaient exclus par l'ancien filtre category=manual.
  const response = await api.get('/audit/reasons', {
    params: { entity_type: entityType },
  });

  const reasons = selectableReasons(response.data);
  // OTHER toujours en dernier
  const sorted = [
    ...reasons.filter((r) => r.code !== 'OTHER'),
    ...reasons.filter((r) => r.code === 'OTHER'),
  ];
  _cache[entityType] = sorted;
  return sorted;
}

export function clearAuditReasonsCache() {
  Object.keys(_cache).forEach((k) => delete _cache[k]);
}
