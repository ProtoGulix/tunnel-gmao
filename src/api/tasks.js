import { api } from '@/lib/api/client';

/**
 * GET /intervention-tasks
 * Retourne les interventions avec leurs tâches agrégées, pagination offset sur les interventions.
 *
 * @param {Object}  params
 * @param {string}  [params.q]               - Recherche full-text
 * @param {string}  [params.status]          - CSV: todo,in_progress,done,skipped
 * @param {string}  [params.origin]          - CSV: plan,resp,tech
 * @param {string}  [params.assigned_to]     - UUID ou "unassigned"
 * @param {number}  [params.skip]            - Offset (nb d'interventions à sauter)
 * @param {number}  [params.limit]           - Nb interventions par page (1-200, défaut 20)
 * @param {boolean} [params.include_done]    - Inclure done/skipped
 * @param {boolean} [params.include_actions] - Précharger actions liées
 * @param {boolean} [params.include_options] - Inclure listes filtres (users, interventions)
 * @param {boolean} [params.include_counters]- Inclure compteurs
 * @returns {Promise<{items, counters, options, pagination, meta, audit, errors}>}
 */
export async function fetchTasksWorkspace(params = {}) {
  const res = await api.get('/intervention-tasks', { params });
  return res.data || {};
}
