/**
 * Audit Logs API
 *
 * GET /audit/logs retourne { items, pagination, facets }
 *   items[]  : id, entity_type, entity_id, decision_type,
 *              old_value, new_value, reason{id,code,label,category,color,description},
 *              reason_text, changed_by{id,first_name,last_name,initials},
 *              is_system, logged_at
 *   pagination : { total, offset, limit, count, total_pages }
 *   facets     : null | { entity_type[], decision_type[], reason_code[] }
 */

import { api } from '@/lib/api/client';

/**
 * @param {Object}  params
 * @param {string}  [params.entity_type]
 * @param {string}  [params.entity_id]
 * @param {string}  [params.reason_code]
 * @param {string}  [params.decision_type]
 * @param {string}  [params.changed_by]      UUID utilisateur
 * @param {string}  [params.from_dt]         ISO 8601
 * @param {string}  [params.to_dt]           ISO 8601
 * @param {boolean} [params.exclude_system]  défaut false
 * @param {boolean} [params.include_facets]  défaut false
 * @param {number}  [params.limit]           max 1000, défaut 50
 * @param {number}  [params.offset]          défaut 0
 * @returns {Promise<{ items: Array, pagination: Object, facets: Object|null }>}
 */
export async function fetchAuditLogs(params = {}) {
  const response = await api.get('/audit/logs', { params });
  const { items = [], pagination = { total: 0, offset: 0, limit: 50, count: 0, total_pages: 0 }, facets = null } = response.data;
  return { items, pagination, facets };
}

/**
 * @returns {Promise<Array<{id, code, label, category, color, description}>>}
 */
export async function fetchAllAuditReasonCodes() {
  const response = await api.get('/audit/reasons', { params: { category: 'manual' } });
  return response.data;
}
