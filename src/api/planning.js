/**
 * @fileoverview API Planning — actions par jour/technicien + interventions ouvertes par équipement
 * @module api/planning
 */

import { api } from '@/lib/api/client';

/**
 * Actions d'un technicien pour un jour donné
 * @param {string} date - Format YYYY-MM-DD
 * @param {string} techId - UUID du technicien
 * @returns {Promise<Array>}
 */
export async function fetchDayActions(date, techId) {
  const res = await api.get('/intervention-actions', { params: { date, tech_id: techId } });
  return res.data ?? [];
}

/**
 * Interventions ouvertes/en_cours pour un équipement
 * @param {string} equipementId - UUID de l'équipement
 * @returns {Promise<Array<{ id, code, title, status_actual, priority, reported_date }>>}
 */
export async function fetchOpenInterventionsByEquipement(equipementId) {
  const res = await api.get('/interventions', {
    params: { equipement_id: equipementId, status: 'ouvert,en_cours', include: '' },
  });
  return Array.isArray(res.data) ? res.data : [];
}

/**
 * Liste des utilisateurs actifs (techniciens)
 * @returns {Promise<Array>}
 */
export async function fetchActiveUsers() {
  const res = await api.get('/users', { params: { status: 'active' } });
  return res.data ?? [];
}

/**
 * Crée une action — payload direct conforme aux specs POST /intervention-actions.
 * Mode bornes  : { intervention_id, description, action_start, action_end, action_subcategory, tech, complexity_score, complexity_factor? }
 * Mode direct  : { intervention_id, description, time_spent, action_subcategory, tech, complexity_score, complexity_factor?, created_at? }
 * @param {Object} payload
 * @returns {Promise<Object>} Action créée
 */
export async function createActionDirect(payload) {
  const res = await api.post('/intervention-actions', payload);
  return res.data;
}
