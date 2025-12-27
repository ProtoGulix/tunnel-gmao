import axios from 'axios';

const BASE_URL = import.meta.env.VITE_DATA_API_URL || 'http://localhost:8055';

export async function checkServerStatus() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 secondes timeout

    const response = await axios.get(`${BASE_URL}/server/ping`, {
      signal: controller.signal,
      timeout: 5000,
    });

    clearTimeout(timeoutId);

    return {
      online: response.status === 200,
      message: 'Serveur accessible',
      latency: response.headers['x-response-time'] || 'N/A',
    };
  } catch (error) {
    if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
      return {
        online: false,
        message: 'Timeout - Serveur ne répond pas',
        error: 'TIMEOUT',
      };
    }

    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
      return {
        online: false,
        message: 'Serveur inaccessible - Vérifiez votre connexion',
        error: 'NETWORK_ERROR',
      };
    }

    return {
      online: false,
      message: `Erreur: ${error.message}`,
      error: error.code || 'UNKNOWN',
    };
  }
}

export function getServerUrl() {
  return BASE_URL;
}
