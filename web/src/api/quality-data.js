/**
 * API Quality Data
 *
 * Endpoint: GET /stats/qualite-donnees
 * Détection des problèmes de complétude et cohérence des données
 */

import { api } from '@/lib/api/client';

/**
 * Récupère les problèmes de qualité des données
 * @param {Object} params - Filtres
 * @param {string} [params.severite] - Filtrer par sévérité: 'high', 'medium'
 * @param {string} [params.entite] - Filtrer par entité: 'intervention_action', 'intervention', 'stock_item', 'purchase_request'
 * @param {string} [params.code] - Filtrer par code anomalie spécifique
 * @returns {Promise<Object>} Données mappées en camelCase
 */
export async function fetchQualityData(params = {}) {
  const response = await api.get('/stats/qualite-donnees', { params });
  return mapQualityDataResponse(response.data);
}

/**
 * Mappe la réponse API (snake_case) vers le domaine frontend (camelCase)
 */
function mapQualityDataResponse(raw) {
  return {
    total: raw.total || 0,

    bySeverity: {
      high: raw.par_severite?.high || 0,
      medium: raw.par_severite?.medium || 0,
    },

    byEntity: raw.par_entite || {},

    problems: (raw.problemes || []).map(mapProblem),
  };
}

/**
 * Mappe un problème individuel
 */
function mapProblem(problem) {
  return {
    code: problem.code,
    severity: problem.severite,
    entity: problem.entite,
    entityId: problem.entite_id,
    message: problem.message,

    context: problem.contexte
      ? {
          interventionId: problem.contexte.intervention_id,
          interventionCode: problem.contexte.intervention_code,
          createdAt: problem.contexte.created_at,
          stockItemRef: problem.contexte.stock_item_ref,
          stockItemName: problem.contexte.stock_item_name,
          purchaseRequestId: problem.contexte.purchase_request_id,
        }
      : null,
  };
}
