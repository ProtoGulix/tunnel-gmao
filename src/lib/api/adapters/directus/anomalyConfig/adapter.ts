/**
 * Anomaly Configuration Adapter (Domain Interface)
 *
 * Interface domain pour la configuration des anomalies.
 * Orchestre datasource + mapper, gère le cache.
 * AUCUNE connaissance du backend - utilise des abstractions.
 *
 * Remplace l'ancien fichier statique anomalyConfig.js.
 *
 * @module lib/api/adapters/directus/anomalyConfig/adapter
 * @see docs/REGLES_METIER.md - Configuration métier centralisée
 * @see docs/tech/API_CONTRACTS.md - Contrats DTO domain
 */

import { apiCall } from '@/lib/api/errors';
import {
  fetchCategoryMetaRaw,
  fetchClassificationProbesRaw,
  fetchThresholdsRaw,
} from './datasource';
import {
  buildAnomalyConfig,
  mapCategoryMeta,
  mapClassificationProbes,
  mapThresholdsArray,
} from './mapper';

// ============================================================================
// Cache
// ============================================================================

let cachedConfig: Record<string, unknown> | null = null;
let cacheTimestamp: number | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Vide le cache de configuration (utile après modifications admin).
 */
export function invalidateAnomalyConfigCache() {
  cachedConfig = null;
  cacheTimestamp = null;
}

// ============================================================================
// Domain Interface (Public API)
// ============================================================================

export const anomalyConfigAdapter = {
  /**
   * Récupère la configuration complète des anomalies depuis le backend.
   * Résultat mis en cache pendant 5 minutes.
   *
   * @returns Configuration format compatible anomalyConfig.js
   */
  fetchAnomalyConfiguration: async () => {
    // Vérifier le cache
    const now = Date.now();
    if (cachedConfig && cacheTimestamp && now - cacheTimestamp < CACHE_TTL) {
      return cachedConfig;
    }

    return apiCall(async () => {
      // Récupérer les 3 tables en parallèle (datasource)
      const [categories, probes, thresholds] = await Promise.all([
        fetchCategoryMetaRaw(),
        fetchClassificationProbesRaw(),
        fetchThresholdsRaw(),
      ]);

      // Construire la configuration (mapper)
      const config = buildAnomalyConfig(categories, probes, thresholds);

      // Mettre en cache
      cachedConfig = config;
      cacheTimestamp = now;

      return config;
    }, 'FetchAnomalyConfiguration');
  },

  /**
   * Récupère uniquement les métadonnées des catégories.
   * @returns Tableau de catégories avec métadonnées
   */
  fetchCategoryMeta: async () => {
    return apiCall(async () => {
      const rawCategories = await fetchCategoryMetaRaw();
      return mapCategoryMeta(rawCategories);
    }, 'FetchCategoryMeta');
  },

  /**
   * Récupère uniquement les sondes de classification actives.
   * @returns Tableau de sondes NLP
   */
  fetchClassificationProbes: async () => {
    return apiCall(async () => {
      const rawProbes = await fetchClassificationProbesRaw();
      return mapClassificationProbes(rawProbes);
    }, 'FetchClassificationProbes');
  },

  /**
   * Récupère uniquement les seuils d'anomalies actifs.
   * @returns Tableau de seuils
   */
  fetchThresholds: async () => {
    return apiCall(async () => {
      const rawThresholds = await fetchThresholdsRaw();
      return mapThresholdsArray(rawThresholds);
    }, 'FetchThresholds');
  },

  /**
   * Vide le cache (utile après modifications dans l'admin).
   */
  invalidateCache: invalidateAnomalyConfigCache,
};
