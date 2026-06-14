/**
 * @fileoverview API Planning — actions par jour/technicien + interventions ouvertes par équipement
 * @module api/planning
 */

import { api } from '@/lib/api/client';

/**
 * Actions sur une plage de dates, tous les techniciens ou un seul.
 * Retourne { [date]: action[] } prêt à l'emploi.
 * @param {string} startDate - Format YYYY-MM-DD
 * @param {string} endDate   - Format YYYY-MM-DD
 * @param {string|null} [techId] - UUID du technicien, omis = tous
 * @returns {Promise<Record<string, Array>>}
 */
export async function fetchWeekActions(startDate, endDate, techId = null) {
  const params = { start_date: startDate, end_date: endDate };
  if (techId) params.tech_id = techId;
  const res = await api.get('/intervention-actions', { params });
  const list = res.data.data ?? [];
  const grouped = {};
  for (const entry of list) {
    grouped[entry.date] = entry.actions ?? [];
  }
  return grouped;
}

/**
 * Interventions actives pour un équipement (ouvert, en_cours, attente_pieces, attente_prod)
 * @param {string} equipementId - UUID de l'équipement
 * @returns {Promise<Array<{ id, code, title, status_actual, priority, reported_date }>>}
 */
export async function fetchOpenInterventionsByEquipement(equipementId) {
  const res = await api.get('/interventions', {
    params: {
      equipement_id: equipementId,
      status: 'ouvert,en_cours,attente_pieces,attente_prod',
    },
  });
  return res.data.items ?? [];
}

/**
 * Interventions actives pour un technicien, avec filtre équipement optionnel.
 * Si equipementId est fourni, délègue à fetchOpenInterventionsByEquipement (filtre plus précis).
 * Sinon, filtre par tech_id — le backend ne supporte pas encore tech_id sur ce endpoint ;
 * on charge toutes les interventions ouvertes sans filtre technicien et on commente le TODO.
 * @param {string|null} techId        - UUID du technicien (ignoré si equipementId fourni)
 * @param {string|null} equipementId  - UUID de l'équipement (prioritaire sur techId)
 * @returns {Promise<Array>}
 */
export async function fetchOpenInterventions({ techId = null, equipementId = null } = {}) {
  if (equipementId) {
    return fetchOpenInterventionsByEquipement(equipementId);
  }
  // TODO: filtrer par technicien quand l'endpoint /interventions supportera tech_id
  const params = { status: 'ouvert,en_cours,attente_pieces,attente_prod' };
  if (techId) params.tech_id = techId;
  const res = await api.get('/interventions', { params });
  return res.data.items ?? [];
}

/**
 * Liste des utilisateurs actifs (techniciens)
 * @returns {Promise<Array>}
 */
export async function fetchActiveUsers() {
  const res = await api.get('/users', { params: { status: 'active' } });
  const payload = res.data;

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.data)) return payload.data;

  return [];
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
  return res.data.data;
}

/**
 * Télécharge la fiche de semaine PDF pour un technicien.
 * @param {string} techId  - UUID du technicien
 * @param {string} weekIso - Semaine ISO YYYY-Www (ex: 2026-W24)
 * @returns {Promise<void>} Déclenche le téléchargement du fichier
 */
export async function fetchPlanningSemainePdf(techId, weekIso) {
  const res = await api.get('/exports/planning/semaine', {
    params: { tech_id: techId, week: weekIso },
    responseType: 'blob',
  });
  const blob = new Blob([res.data], { type: 'application/pdf' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `planning_${weekIso}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
