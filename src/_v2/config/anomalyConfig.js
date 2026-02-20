/**
 * Anomaly Configuration Loader
 *
 * Provides synchronous access to anomaly configuration for utility functions.
 * Configuration is loaded at app startup via main.jsx.
 *
 * Architecture:
 * - React components: use useAnomalyConfig hook
 * - Pure utility functions: use ANOMALY_CONFIG from this module
 * - Config loaded from adapter (backend-agnostic)
 *
 * @module config/anomalyConfig
 */

import { anomalyConfig } from '@/lib/api/facade';

// ============================================================================
// State Management
// ============================================================================

let cachedConfig = null;
let loadPromise = null;

/**
 * Loads anomaly configuration from backend adapter.
 * Called automatically at app startup (main.jsx).
 *
 * @returns {Promise<Object>} Anomaly configuration
 */
export async function loadAnomalyConfig() {
  // Return existing load promise if already loading
  if (loadPromise) {
    return loadPromise;
  }

  // Return cached config if available
  if (cachedConfig) {
    return cachedConfig;
  }

  // Start loading
  loadPromise = anomalyConfig
    .fetchAnomalyConfiguration()
    .then((config) => {
      cachedConfig = config;
      loadPromise = null;
      return config;
    })
    .catch((error) => {
      console.error('Failed to load anomaly configuration:', error);
      loadPromise = null;
      // Return fallback empty config
      const fallback = {
        thresholds: {},
        simpleCategories: [],
        suspiciousKeywords: [],
        lowValueCategories: [],
      };
      cachedConfig = fallback;
      return fallback;
    });

  return loadPromise;
}

/**
 * Gets cached anomaly configuration synchronously.
 * Used by utility functions (actionUtils.js).
 *
 * ⚠️ IMPORTANT: Must call loadAnomalyConfig() first at app startup.
 *
 * @returns {Object} Cached anomaly configuration
 */
export function getAnomalyConfig() {
  if (!cachedConfig) {
    console.warn('Anomaly configuration not loaded yet. Using fallback empty config.');
    return {
      thresholds: {},
      simpleCategories: [],
      suspiciousKeywords: [],
      lowValueCategories: [],
    };
  }
  return cachedConfig;
}

/**
 * Invalidates cached configuration.
 * Forces reload on next access.
 */
export function invalidateAnomalyConfig() {
  cachedConfig = null;
  loadPromise = null;
  // Also invalidate adapter cache
  if (anomalyConfig.invalidateCache) {
    anomalyConfig.invalidateCache();
  }
}

/**
 * Legacy export for backward compatibility with actionUtils.js.
 * Provides synchronous Proxy access to configuration.
 *
 * ⚠️ React components should use useAnomalyConfig hook instead.
 */
export const ANOMALY_CONFIG = new Proxy(
  {},
  {
    get(target, prop) {
      const config = getAnomalyConfig();
      return config[prop];
    },
  }
);
