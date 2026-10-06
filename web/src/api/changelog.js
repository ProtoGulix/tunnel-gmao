/**
 * API Changelog — Nouveautés depuis la dernière visite de l'utilisateur
 *
 * @module api/changelog
 */

import { api } from '@/lib/api/client';

/**
 * Récupère les entrées de changelog non encore vues par l'utilisateur connecté
 * Retourne { current_version, entries }
 */
export async function getMyChangelog() {
  const response = await api.get('/users/me/changelog');
  return response.data?.data || response.data;
}

/**
 * Marque le changelog comme vu jusqu'à la version courante
 */
export async function markMyChangelogSeen() {
  const response = await api.patch('/users/me/changelog-seen');
  return response.data?.data || response.data;
}
