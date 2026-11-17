/**
 * API Organisation de l'équipe
 *
 * Endpoint backend : GET /stats/organisation (ADR 0021). Chiffres d'équipe uniquement.
 *
 * @module api/organisation
 */

import { api } from '@/lib/api/client';

/**
 * @param {Object} [params]
 * @param {string} [params.startDate] - AAAA-MM-JJ (défaut serveur : 12 mois calendaires)
 * @param {string} [params.endDate] - AAAA-MM-JJ (défaut serveur : aujourd'hui)
 * @returns {Promise<Object>} period, monthly, totals, projects, preventive, waiting_parts
 */
export async function fetchOrganisation(params = {}) {
  const query = {};
  if (params.startDate) query.start_date = params.startDate;
  if (params.endDate) query.end_date = params.endDate;
  // /stats/organisation n'a pas d'enveloppe { data } : response.data est déjà la réponse
  const response = await api.get('/stats/organisation', { params: query });
  return response.data;
}
