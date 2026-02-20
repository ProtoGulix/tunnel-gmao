/**
 * Client HTTP — Tunnel GMAO V3
 *
 * Client HTTP pur basé sur axios avec :
 * - Authentification JWT automatique
 * - Gestion centralisée des erreurs (401, 403, 404, 500)
 * - Pas de transformation de données
 * - Pas de logique métier
 *
 * @module lib/api/client
 *
 * Usage :
 * ```javascript
 * import { api } from '@/lib/api/client';
 * const response = await api.get('/interventions');
 * const data = response.data;
 * ```
 */

import axios from 'axios';

// ==============================
// CONFIGURATION
// ==============================

/**
 * URL de base de l'API backend Python (FastAPI)
 */
export const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Instance axios préconfigurée pour l'API Tunnel GMAO
 *
 * Fonctionnalités :
 * - Envoie automatiquement les cookies (session_token)
 * - Fallback sur Authorization header si token dans localStorage
 * - Gère les erreurs 401 avec redirection vers /login
 * - Gère les erreurs 403, 404, 500 avec logging
 * - Content-Type: application/json par défaut
 */
export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 secondes
  withCredentials: true, // Active l'envoi automatique des cookies
});

// ==============================
// REQUEST INTERCEPTOR
// ==============================

/**
 * Ajoute le token JWT dans le header Authorization en fallback
 * (Le cookie session_token est automatiquement envoyé par le navigateur)
 */
api.interceptors.request.use(
  (config) => {
    // Fallback : si un token est stocké localement, l'envoyer en header
    // (Utile pour mobile ou si les cookies sont désactivés)
    const token = localStorage.getItem('auth_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ==============================
// RESPONSE INTERCEPTOR
// ==============================

/**
 * Gère les erreurs HTTP de manière centralisée
 *
 * - 401 (Non autorisé) : efface les tokens et redirige vers /login
 * - 403 (Interdit) : log l'erreur pour debugging
 * - 404 (Non trouvé) : log l'erreur
 * - 500 (Erreur serveur) : log l'erreur
 * - Autres : propage l'erreur à l'appelant
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // 401 Unauthorized - Session expirée ou token invalide
    if (status === 401) {
      // Sauvegarder la page actuelle pour redirection après login
      const currentPath = window.location.pathname + window.location.search;
      if (currentPath !== '/login') {
        localStorage.setItem('redirect_after_login', currentPath);
      }

      // Nettoyer les tokens
      localStorage.removeItem('auth_access_token');
      localStorage.removeItem('auth_refresh_token');
      localStorage.removeItem('auth_user');

      // Rediriger vers login
      window.location.href = '/login';
    }

    // 403 Forbidden - Permissions insuffisantes
    if (status === 403) {
      console.error('[API] 403 Forbidden - Accès refusé', {
        url: error.config?.url,
        method: error.config?.method,
        message: error.response?.data?.message,
      });
    }

    // 404 Not Found
    if (status === 404) {
      console.warn('[API] 404 Not Found', {
        url: error.config?.url,
        method: error.config?.method,
      });
    }

    // 500 Internal Server Error
    if (status === 500) {
      console.error('[API] 500 Internal Server Error', {
        url: error.config?.url,
        method: error.config?.method,
        message: error.response?.data?.message,
      });
    }

    return Promise.reject(error);
  }
);
