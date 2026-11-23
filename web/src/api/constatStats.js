/**
 * Indicateurs des constats (ADR 0044) : GET /stats/constats, enveloppe { data } déballée par l'intercepteur.
 */
import { api } from '@/lib/api/client';

/**
 * @param {{startDate: string, endDate: string}} params - AAAA-MM-JJ
 * @returns {Promise<Object>} period, total, by_month, levers, signals, known_since, outcomes
 */
export async function fetchConstatStats({ startDate, endDate }) {
  const response = await api.get('/stats/constats', { params: { start_date: startDate, end_date: endDate } });
  return response.data;
}
