/**
 * Interventions API Layer
 *
 * Appels HTTP bruts vers le backend Python.
 * Aucune logique métier, juste fetch + mapping snake_case → camelCase.
 */

import { api } from '@/lib/api/client';

/**
 * Récupère la liste des interventions avec filtres optionnels
 *
 * @param {Object} filters - Filtres optionnels
 * @param {number} [filters.skip=0] - Offset de pagination
 * @param {number} [filters.limit=1000] - Nombre max d'interventions
 * @param {string} [filters.equipementId] - Filtrer par équipement UUID
 * @param {string} [filters.status] - Filtrer par statut (csv: "ouvert,ferme")
 * @param {string} [filters.priority] - Filtrer par priorité (csv: "urgent,important")
 * @param {string} [filters.sort] - Tri (ex: "-priority,-reported_date")
 * @returns {Promise<Array>} Liste d'interventions
 */
// eslint-disable-next-line complexity
export async function fetchInterventions(filters = {}) {
  const params = {
    skip: filters.skip ?? 0,
    limit: filters.limit ?? 1000,
  };

  // Ajouter les filtres optionnels
  if (filters.equipementId) params.equipement_id = filters.equipementId;
  if (filters.status) params.status = filters.status;
  if (filters.priority) params.priority = filters.priority;
  if (filters.sort) params.sort = filters.sort;

  const response = await api.get('/interventions', { params });
  const list = Array.isArray(response.data) ? response.data : response.data?.data || [];

  return list.map(mapInterventionResponse);
}

/**
 * Mappe une intervention du backend (snake_case) vers le front (camelCase)
 */
// eslint-disable-next-line complexity
function mapInterventionResponse(raw = {}) {
  return {
    id: raw.id?.toString() || '',
    code: raw.code || '',
    title: raw.title || '',
    status: raw.status_actual || raw.status || '',
    type: raw.type_inter || raw.type || 'CUR',
    priority: raw.priority || 'normal',
    reportedDate: raw.reported_date,
    printedFiche: raw.printed_fiche ?? false,
    techInitials: raw.tech_initials || '',
    reportedBy: raw.reported_by || '',
    machine: raw.equipements
      ? {
          id: raw.equipements.id?.toString() || '',
          code: raw.equipements.code || '',
          name: raw.equipements.name || raw.equipements.code || 'Équipement',
          health: {
            level: raw.equipements.health?.level || 'ok',
            reason: raw.equipements.health?.reason || '',
          },
        }
      : null,
    stats: raw.stats
      ? {
          actionCount: raw.stats.action_count ?? 0,
          totalTime: raw.stats.total_time ?? 0,
          avgComplexity: raw.stats.avg_complexity ?? 0,
          purchaseCount: raw.stats.purchase_count ?? 0,
        }
      : null,
  };
}
