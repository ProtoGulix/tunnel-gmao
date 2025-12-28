/**
 * Anomaly Configuration Datasource (Directus)
 *
 * Récupère les données brutes depuis PostgreSQL via Directus.
 * AUCUNE transformation de données - retourne les réponses backend telles quelles.
 *
 * @module lib/api/adapters/directus/anomalyConfig/datasource
 * @see docs/tech/API_CONTRACTS.md - Architecture backend-agnostic
 */

import { api } from '@/lib/api/client';

/**
 * Récupère les métadonnées des catégories d'actions (raw backend data).
 */
export async function fetchCategoryMetaRaw() {
  const { data } = await api.get('/items/action_category_meta', {
    params: {
      limit: -1,
      sort: 'category_code',
      fields:
        'category_code,is_simple,is_low_value,typical_duration_min,typical_duration_max',
    },
  });
  return data.data || [];
}

/**
 * Récupère les sondes de classification actives (raw backend data).
 */
export async function fetchClassificationProbesRaw() {
  const { data } = await api.get('/items/action_classification_probe', {
    params: {
      limit: -1,
      filter: { is_active: { _eq: true } },
      sort: 'keyword',
      fields: 'keyword,suggested_category,severity,description',
    },
  });
  return data.data || [];
}

/**
 * Récupère les seuils d'anomalies actifs (raw backend data).
 */
export async function fetchThresholdsRaw() {
  const { data } = await api.get('/items/anomaly_threshold', {
    params: {
      limit: -1,
      filter: { is_active: { _eq: true } },
      sort: 'anomaly_type',
      fields:
        'anomaly_type,threshold_value,threshold_unit,high_severity_value,config_json',
    },
  });
  return data.data || [];
}
