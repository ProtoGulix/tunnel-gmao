/**
 * @fileoverview API accueil par rôle — référentiel des vues, vue de l'utilisateur
 * courant, et CRUD admin de l'assignation rôle → vue.
 * @module api/homeView
 */

import { api } from '@/lib/api/client';

/**
 * Référentiel des vues d'accueil disponibles.
 * @returns {Promise<Array<{code: string, label: string}>>}
 */
export async function fetchHomeViews() {
  const res = await api.get('/home-view');
  return res.data ?? [];
}

/**
 * Vue d'accueil assignée à l'utilisateur courant (résolue depuis son rôle).
 * 'technicien' par défaut si aucune configuration explicite pour son rôle.
 * @returns {Promise<{code: string, label: string}>}
 */
export async function fetchMyHomeView() {
  const res = await api.get('/home-view/me');
  return res.data;
}

/**
 * Liste les assignations rôle → vue explicitement configurées (admin).
 * @returns {Promise<Array>}
 */
export async function fetchHomeViewAssignments() {
  const res = await api.get('/home-view/admin/assignments');
  return Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
}

/**
 * Assigne (ou remplace) la vue d'accueil d'un rôle (admin).
 * @param {string} roleId
 * @param {string} homeView - code de la vue (voir fetchHomeViews)
 * @returns {Promise<Object>}
 */
export async function upsertHomeViewAssignment(roleId, homeView) {
  const res = await api.put(`/home-view/admin/assignments/${roleId}`, { home_view: homeView });
  return res.data;
}

/**
 * Retire la configuration explicite d'un rôle (admin) — il retombe sur la vue par défaut.
 * @param {string} roleId
 * @returns {Promise<void>}
 */
export async function deleteHomeViewAssignment(roleId) {
  await api.delete(`/home-view/admin/assignments/${roleId}`);
}
