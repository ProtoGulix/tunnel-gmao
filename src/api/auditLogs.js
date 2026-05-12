/**
 * Audit Logs API
 *
 * Réponse GET /audit/logs : tableau plat d'objets avec :
 *   id, entity_type, entity_id, decision_type,
 *   old_value, new_value, reason{code,label,color,...},
 *   reason_text, changed_by (UUID), is_system, logged_at
 */

import { api } from '@/lib/api/client';

/**
 * @param {Object} params
 * @param {string}  [params.entity_type]
 * @param {string}  [params.entity_id]
 * @param {string}  [params.reason_code]
 * @param {string}  [params.from_dt]       ISO 8601
 * @param {string}  [params.to_dt]         ISO 8601
 * @param {boolean} [params.exclude_system]
 * @param {number}  [params.limit]         max 1000, défaut 200
 * @param {number}  [params.offset]
 * @returns {Promise<Array>}
 */
export async function fetchAuditLogs(params = {}) {
  const response = await api.get('/audit/logs', { params });
  return Array.isArray(response.data) ? response.data : response.data?.data ?? [];
}

/**
 * @returns {Promise<Array<{id, code, label, category, color, description}>>}
 */
export async function fetchAllAuditReasonCodes() {
  const response = await api.get('/audit/reasons', { params: { category: 'manual' } });
  return Array.isArray(response.data) ? response.data : response.data?.data ?? [];
}
