import axios from 'axios';

const BASE_URL = import.meta.env.VITE_DATA_API_URL || 'http://localhost:8055';

export async function checkServerStatus() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 secondes timeout
    const startedAt = performance.now();

    const response = await axios.get(`${BASE_URL}/server/ping`, {
      signal: controller.signal,
      timeout: 5000,
    });

    clearTimeout(timeoutId);

    const latencyHeader = response.headers['x-response-time'];
    const measuredLatency = Math.max(0, performance.now() - startedAt);
    const latencyMs = latencyHeader ? Number(latencyHeader) || measuredLatency : measuredLatency;

    return {
      online: response.status === 200,
      message: 'Serveur accessible',
      latencyMs,
      lastChecked: new Date().toISOString(),
      health: 'ok',
    };
  } catch (error) {
    if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
      return {
        online: false,
        message: 'Timeout - Serveur ne répond pas',
        error: 'TIMEOUT',
        latencyMs: null,
        lastChecked: new Date().toISOString(),
        health: 'degraded',
      };
    }

    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return {
        online: false,
        message: 'Serveur inaccessible - Vérifiez votre connexion',
        error: 'NETWORK_ERROR',
        latencyMs: null,
        lastChecked: new Date().toISOString(),
        health: 'down',
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

export function getServerUrl() {
  return BASE_URL;
}
