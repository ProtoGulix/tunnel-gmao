import { api } from '@/lib/api/client';

/**
 * GET /tasks/workspace
 * Endpoint unifié pour la page Tasks — retourne tâches, compteurs, options en un seul appel.
 *
 * @param {Object} params
 * @param {string}  [params.q]               - Recherche full-text
 * @param {string}  [params.status]          - CSV: todo,in_progress,done,skipped
 * @param {string}  [params.origin]          - CSV: plan,resp,tech
 * @param {string}  [params.assignee_id]     - UUID ou "unassigned"
 * @param {string}  [params.grouping]        - intervention|machine|status|technician
 * @param {string}  [params.cursor]          - Curseur pagination
 * @param {number}  [params.limit]           - Nb tâches (1-200, défaut 50)
 * @param {boolean} [params.include_closed]  - Inclure done/skipped
 * @param {boolean} [params.include_actions] - Précharger actions liées
 * @param {boolean} [params.include_options] - Inclure listes filtres (users, interventions)
 * @param {boolean} [params.include_counters]- Inclure compteurs
 * @returns {Promise<{tasks, counters, options, pagination, meta, errors}>}
 */
export async function fetchTasksWorkspace(params = {}) {
  const res = await api.get('/tasks/workspace', { params });
  return res.data || {};
}
