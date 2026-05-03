/**
 * API Auth — Appels HTTP d'authentification
 *
 * @module api/auth
 */

import { api } from '@/lib/api/client';

function extractAuthData(response) {
  return response?.data?.data || response?.data;
}

/**
 * Connexion utilisateur
 * Retourne { access_token, refresh_token, expires_in, user }
 */
export async function login(email, password) {
  const normalizedEmail = String(email || '').trim();
  const response = await api.post('/auth/login', {
    email: normalizedEmail,
    password,
  });
  return extractAuthData(response);
}

/**
 * Rafraîchit le access_token via le refresh_token
 * Retourne { access_token, refresh_token, expires_in }
 */
export async function refreshToken(token) {
  const response = await api.post('/auth/refresh', { refresh_token: token });
  return extractAuthData(response);
}

/**
 * Déconnexion — révoque la session côté backend
 */
export async function logout() {
  try {
    await api.post('/auth/logout');
  } catch {
    // Ignorer les erreurs réseau lors du logout
  }
}

/**
 * Vérifie si un token d'accès est présent en localStorage
 */
export function isAuthenticated() {
  return !!localStorage.getItem('auth_access_token');
}
