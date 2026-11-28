/**
 * Interventions bloquées (ADR 0047) : GET /stats/blocages, enveloppe { data } déballée par l'intercepteur.
 */
import { api } from '@/lib/api/client';

/**
 * @param {{siteId?: string}} [params] - équipement racine, descendants compris
 * @returns {Promise<{threshold_days: number, parts: Array, production: Array}>}
 */
export async function fetchBlocages({ siteId } = {}) {
  const response = await api.get('/stats/blocages', { params: { site_id: siteId || undefined } });
  return response.data;
}
