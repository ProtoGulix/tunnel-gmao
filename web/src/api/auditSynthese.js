/**
 * API Synthèse de l'audit
 *
 * Endpoint backend : GET /stats/audit-synthese (ADR 0032). Chiffres d'équipe uniquement.
 *
 * @module api/auditSynthese
 */

import { api } from '@/lib/api/client';

/**
 * @param {Object} [params]
 * @param {number} [params.months] - 1 à 120 (défaut serveur : 3)
 * @returns {Promise<Object>} period, cascades_traced_from, monthly, totals, decisions
 */
export async function fetchAuditSynthese(params = {}) {
  const query = {};
  if (params.months) query.months = params.months;
  // Pas d'enveloppe { data } : response.data est déjà la réponse
  const response = await api.get('/stats/audit-synthese', { params: query });
  return response.data;
}
