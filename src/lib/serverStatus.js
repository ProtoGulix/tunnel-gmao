import { BASE_URL } from '@/lib/api/client';

const HEALTH_PATH = '/health';
const HEALTH_TIMEOUT_MS = 5000;

function getHealthUrl() {
  return `${String(BASE_URL).replace(/\/$/, '')}${HEALTH_PATH}`;
}

/**
 * Vérifie l'état du serveur backend
 *
 * @returns {Promise<Object>} Statut du serveur avec online, message, latencyMs, lastChecked, health
 */
export async function checkServerStatus() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
    const startedAt = performance.now();

    // no-cors permet un test de joignabilite sans exiger les en-tetes CORS.
    // Le resultat est opaque: on valide la connectivite reseau, pas le code HTTP.
    await fetch(getHealthUrl(), {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      credentials: 'omit',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const latencyMs = Math.max(0, performance.now() - startedAt);

    return {
      online: true,
      message: 'Serveur accessible',
      latencyMs,
      lastChecked: new Date().toISOString(),
      health: 'ok',
    };
  } catch (error) {
    if (error?.name === 'AbortError') {
      return {
        online: false,
        message: 'Timeout - Serveur ne répond pas',
        error: 'TIMEOUT',
        latencyMs: null,
        lastChecked: new Date().toISOString(),
        health: 'degraded',
      };
    }

    return {
      online: false,
      message: `Erreur: ${error.message}`,
      error: error.code || 'UNKNOWN',
      latencyMs: null,
      lastChecked: new Date().toISOString(),
      health: 'down',
    };
  }
}

/**
 * Retourne l'URL du serveur backend
 *
 * @returns {string} URL de base du serveur
 */
export function getServerUrl() {
  return BASE_URL;
}
