/**
 * Anomaly Configuration Adapter (Directus)
 *
 * Récupère la configuration dynamique depuis PostgreSQL via Directus :
 * - action_category_meta : Métadonnées catégories (durées, valeur)
 * - action_classification_probe : Sondes NLP (mots-clés suspects)
 * - anomaly_threshold : Seuils de détection (6 types)
 *
 * Transforme les données au format attendu par actionUtils.js
 * Remplace l'ancien fichier statique anomalyConfig.js
 *
 * @see docs/REGLES_METIER.md - Configuration métier centralisée
 * @see db/schema/03_meta/ - Tables configuration
 */

import { api } from '@/lib/api/client';
import { apiCall } from '@/lib/api/errors';

// ============================================================================
// Response Mappers (Directus → Domain)
// ============================================================================

/**
 * Transforme les données PostgreSQL en format compatible anomalyConfig.js
 */
const buildAnomalyConfig = (categories, probes, thresholds) => {
  // 1. Construire simpleCategories et lowValueCategories
  const simpleCategories = categories
    .filter((cat) => cat.is_simple)
    .map((cat) => cat.category_code);

  const lowValueCategories = categories
    .filter((cat) => cat.is_low_value)
    .map((cat) => cat.category_code);

  // 2. Extraire les mots-clés suspects
  const suspiciousKeywords = probes.map((probe) => probe.keyword);

  // 3. Transformer les seuils en objet thresholds
  const thresholdsMap = {};
  thresholds.forEach((threshold) => {
    const config = threshold.config_json || {};
    thresholdsMap[threshold.anomaly_type] = {
      ...config,
      threshold_value: threshold.threshold_value,
      high_severity_value: threshold.high_severity_value,
    };
  });

  return {
    simpleCategories,
    lowValueCategories,
    suspiciousKeywords,
    thresholds: thresholdsMap,

    // Configuration badges (statique, non modifiable via DB pour l'instant)
    complexityBadges: [
      { max: 3, color: 'green', label: 'Faible' },
      { max: 6, color: 'orange', label: 'Moyenne' },
      { max: 10, color: 'red', label: 'Élevée' },
    ],
    priorityBadges: [
      { max: 2, color: 'red', label: 'Urgent' },
      { max: 6, color: 'orange', label: 'Important' },
      { max: Infinity, color: 'blue', label: 'Normal' },
    ],
    recurrenceBadges: [
      { max: 4, color: 'red', label: 'Très récurrent' },
      { max: 9, color: 'orange', label: 'Récurrent' },
      { max: Infinity, color: 'blue', label: 'Modéré' },
    ],
  };
};

// ============================================================================
// Cache
// ============================================================================

let cachedConfig = null;
let cacheTimestamp = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Vide le cache de configuration (utile après modifications admin)
 */
export const invalidateAnomalyConfigCache = () => {
  cachedConfig = null;
  cacheTimestamp = null;
};

// ============================================================================
// API Methods (Domain interface)
// ============================================================================

export const anomalyConfigAdapter = {
  /**
   * Récupère la configuration complète des anomalies depuis PostgreSQL.
   * Résultat mis en cache pendant 5 minutes.
   *
   * @returns {Promise<Object>} Configuration format compatible anomalyConfig.js
   */
  fetchAnomalyConfiguration: async () => {
    // Vérifier le cache
    const now = Date.now();
    if (cachedConfig && cacheTimestamp && now - cacheTimestamp < CACHE_TTL) {
      return cachedConfig;
    }

    return apiCall(async () => {
      // Récupérer les 3 tables en parallèle
      const [categoriesRes, probesRes, thresholdsRes] = await Promise.all([
        // 1. Métadonnées catégories
        api.get('/items/action_category_meta', {
          params: {
            limit: -1,
            sort: 'category_code',
            fields:
              'category_code,is_simple,is_low_value,typical_duration_min,typical_duration_max',
          },
        }),

        // 2. Sondes classification (actives uniquement)
        api.get('/items/action_classification_probe', {
          params: {
            limit: -1,
            filter: { is_active: { _eq: true } },
            sort: 'keyword',
            fields: 'keyword,suggested_category,severity,description',
          },
        }),

        // 3. Seuils anomalies (actifs uniquement)
        api.get('/items/anomaly_threshold', {
          params: {
            limit: -1,
            filter: { is_active: { _eq: true } },
            sort: 'anomaly_type',
            fields: 'anomaly_type,threshold_value,threshold_unit,high_severity_value,config_json',
          },
        }),
      ]);

      // Construire la configuration
      const config = buildAnomalyConfig(
        categoriesRes.data.data || [],
        probesRes.data.data || [],
        thresholdsRes.data.data || []
      );

      // Mettre en cache
      cachedConfig = config;
      cacheTimestamp = now;

      return config;
    }, 'FetchAnomalyConfiguration');
  },

  /**
   * Récupère uniquement les métadonnées des catégories.
   * @returns {Promise<Object[]>} Tableau de catégories avec métadonnées
   */
  fetchCategoryMeta: async () => {
    return apiCall(async () => {
      const { data } = await api.get('/items/action_category_meta', {
        params: {
          limit: -1,
          sort: 'category_code',
        },
      });
      return data.data;
    }, 'FetchCategoryMeta');
  },

  /**
   * Récupère uniquement les sondes de classification actives.
   * @returns {Promise<Object[]>} Tableau de sondes NLP
   */
  fetchClassificationProbes: async () => {
    return apiCall(async () => {
      const { data } = await api.get('/items/action_classification_probe', {
        params: {
          limit: -1,
          filter: { is_active: { _eq: true } },
          sort: 'keyword',
        },
      });
      return data.data;
    }, 'FetchClassificationProbes');
  },

  /**
   * Récupère uniquement les seuils d'anomalies actifs.
   * @returns {Promise<Object[]>} Tableau de seuils
   */
  fetchThresholds: async () => {
    return apiCall(async () => {
      const { data } = await api.get('/items/anomaly_threshold', {
        params: {
          limit: -1,
          filter: { is_active: { _eq: true } },
          sort: 'anomaly_type',
        },
      });
      return data.data;
    }, 'FetchThresholds');
  },

  /**
   * Vide le cache (utile après modifications dans Directus admin).
   */
  invalidateCache: invalidateAnomalyConfigCache,
};
