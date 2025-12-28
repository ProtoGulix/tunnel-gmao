/**
 * Anomaly Configuration Hook
 *
 * Charge la configuration dynamique des anomalies depuis le backend.
 * Remplace l'ancien fichier statique anomalyConfig.js.
 *
 * Usage:
 * ```jsx
 * import { useAnomalyConfig } from '@/hooks/useAnomalyConfig';
 *
 * function MyComponent() {
 *   const { config, loading, error, invalidate } = useAnomalyConfig();
 *
 *   if (loading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *
 *   // Utiliser config.simpleCategories, config.thresholds, etc.
 *   const isSimple = config.simpleCategories.includes('BAT');
 * }
 * ```
 *
 * @see src/lib/api/facade - API backend-agnostic
 * @see docs/REGLES_METIER.md - Configuration métier centralisée
 */

import { useState, useEffect } from 'react';
import { API } from '@/lib/api/facade';

/**
 * Hook pour récupérer la configuration des anomalies.
 *
 * @returns {{
 *   config: Object|null - Configuration (format compatible anomalyConfig.js)
 *   loading: boolean - Chargement en cours
 *   error: Error|null - Erreur éventuelle
 *   invalidate: Function - Fonction pour forcer un rechargement
 * }}
 */
export function useAnomalyConfig() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const loadConfig = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await API.anomalyConfig.fetchAnomalyConfiguration();

        if (!cancelled) {
          setConfig(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load anomaly configuration:', err);
          setError(err);
          setLoading(false);
        }
      }
    };

    loadConfig();

    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  /**
   * Force un rechargement de la configuration (vide le cache).
   */
  const invalidate = () => {
    API.anomalyConfig.invalidateCache();
    setRefreshKey((prev) => prev + 1);
  };

  return { config, loading, error, invalidate };
}

/**
 * Utilitaire : Retourne la configuration d'un badge selon un score.
 * Compatible avec l'ancienne fonction getBadgeConfig d'anomalyConfig.js.
 *
 * @param {number} value - Valeur à évaluer
 * @param {Array} badgeConfig - Configuration des badges
 * @returns {Object} Configuration du badge
 */
export function getBadgeConfig(value, badgeConfig) {
  return badgeConfig.find((badge) => value <= badge.max) || badgeConfig[badgeConfig.length - 1];
}
