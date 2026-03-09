/**
 * API Auth — Appels HTTP d'authentification
 *
 * Fonctions pour gérer l'authentification avec le backend FastAPI.
 * Utilise le client HTTP pur sans logique métier.
 *
 * @module api/auth
 */

import { api } from '@/lib/api/client';

function extractAuthData(response) {
  return response?.data?.data || response?.data;
}

/**
 * Connexion utilisateur
 *
 * @param {string} email - Email de l'utilisateur
 * @param {string} password - Mot de passe
 * @returns {Promise<Object>} Tokens et informations utilisateur
 * @throws {Error} Si les identifiants sont incorrects
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
 * Récupérer les informations de l'utilisateur connecté
 *
 * @returns {Promise<Object>} Données utilisateur
 * @throws {Error} Si non authentifié
 */
export async function getCurrentUser() {
  const response = await api.get('/users/me');
  return response.data;
}

/**
 * Déconnexion utilisateur
 * Note : Pas d'endpoint logout côté backend, on nettoie juste le localStorage
 *
 * @returns {Promise<void>}
 */
export async function logout() {
  // Pas d'endpoint /auth/logout dans le backend
  // On nettoie juste les tokens côté client
  return Promise.resolve();
}

/**
 * Vérifier si l'utilisateur est authentifié
 *
 * Note : En mode cookie, cette fonction vérifie juste si on a un cache utilisateur.
 * La vraie vérification se fait côté serveur avec le cookie session_token.
 *
 * @returns {boolean} True si un token ou un cache utilisateur est présent
 */
export function isAuthenticated() {
  return !!localStorage.getItem('auth_access_token') || !!localStorage.getItem('auth_user');
}
