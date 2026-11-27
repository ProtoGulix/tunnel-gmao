/**
 * Bilan des demandes à qualifier (ADR 0046) : GET /stats/demandes, enveloppe { data } déballée par l'intercepteur.
 */
import { api } from '@/lib/api/client';

/**
 * @param {{siteId?: string}} [params] - équipement racine, descendants compris
 * @returns {Promise<Object>} stock, trend, flow, age_buckets, sites, equipments
 */
export async function fetchDemandeStats({ siteId } = {}) {
  const response = await api.get('/stats/demandes', { params: { site_id: siteId || undefined } });
  return response.data;
}
