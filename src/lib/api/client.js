/**
 * Client HTTP — Tunnel GMAO V3
 *
 * Client HTTP pur basé sur axios avec :
 * - Authentification JWT automatique (Bearer token)
 * - Refresh automatique sur 401 avant de renvoyer la requête
 * - Gestion centralisée des erreurs (403, 404, 500)
 *
 * @module lib/api/client
 */

import axios from 'axios';
import { emitSystemError } from '@/lib/api/systemErrors';
import { isAuditRequiredError, handleAuditError, cacheAuditFromResponse } from '@/lib/api/auditGuard';

// ==============================
// CONFIGURATION
// ==============================

export const BASE_URL =
  import.meta.env.VITE_TUNNEL_BACKEND_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:8000';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
  withCredentials: true,
});

// ==============================
// STATE DU REFRESH
// ==============================

let isRefreshing = false;
let refreshSubscribers = [];

function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

function onRefreshDone(newToken) {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
}

function redirectToLogin() {
  const currentPath = window.location.pathname + window.location.search;
  if (currentPath !== '/login') {
    localStorage.setItem('redirect_after_login', currentPath);
  }
  localStorage.removeItem('auth_access_token');
  localStorage.removeItem('auth_refresh_token');
  localStorage.removeItem('auth_user');
  window.location.href = '/login';
}

// ==============================
// REQUEST INTERCEPTOR
// ==============================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==============================
// RESPONSE INTERCEPTOR
// ==============================

api.interceptors.response.use(
  (response) => {
    cacheAuditFromResponse(response);
    if (
      response.data !== null &&
      typeof response.data === 'object' &&
      !Array.isArray(response.data) &&
      Object.keys(response.data).length === 1 &&
      'data' in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  async (error) => {
    const status = error.response?.status;
    const originalRequest = error.config;

    // 401 — tenter un refresh avant de rediriger
    // Exclure le endpoint de login : un 401 = mauvais identifiants, pas besoin de refresh
    if (status === 401 && !originalRequest._retry && !originalRequest.url?.endsWith('/auth/login')) {
      const storedRefreshToken = localStorage.getItem('auth_refresh_token');

      if (!storedRefreshToken) {
        redirectToLogin();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Mettre en file d'attente pendant le refresh en cours
        return new Promise((resolve, reject) => {
          subscribeTokenRefresh((newToken) => {
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              resolve(api(originalRequest));
            } else {
              reject(error);
            }
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${BASE_URL}/auth/refresh`,
          { refresh_token: storedRefreshToken },
          { withCredentials: true }
        );
        const data = response.data?.data || response.data;
        const newAccessToken = data.access_token;
        const newRefreshToken = data.refresh_token;

        localStorage.setItem('auth_access_token', newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem('auth_refresh_token', newRefreshToken);
        }

        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        onRefreshDone(newAccessToken);
        isRefreshing = false;

        return api(originalRequest);
      } catch {
        isRefreshing = false;
        onRefreshDone(null);
        redirectToLogin();
        return Promise.reject(error);
      }
    }

    // 400/422 — reason_code manquant (middleware ou Pydantic) : déléguer au handler audit
    if (!originalRequest._auditRetry && isAuditRequiredError(error)) {
      return handleAuditError(error);
    }

    // 403 Forbidden
    if (status === 403) {
      console.error('[API] 403 Forbidden', { url: error.config?.url });
      emitSystemError(error);
    }

    // 404 Not Found
    if (status === 404) {
      console.warn('[API] 404 Not Found', { url: error.config?.url });
    }

    // 5xx Server Error
    if (status >= 500) {
      console.error(`[API] ${status} Server Error`, { url: error.config?.url });
      emitSystemError(error);
    }

    // Erreur réseau
    if (!status) {
      emitSystemError(error);
    }

    return Promise.reject(error);
  }
);
