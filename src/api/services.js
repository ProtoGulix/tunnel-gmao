/**
 * Services API Layer
 *
 * Appels HTTP bruts vers /services.
 * Référentiel des services/départements pour les demandes d'intervention.
 */

import { api } from '@/lib/api/client';

/**
 * Récupère la liste de tous les services actifs, triés par libellé ASC
 *
 * @returns {Promise<Array<{id: string, code: string, label: string, is_active: boolean}>>}
 */
export async function fetchServices() {
  const response = await api.get('/services');
  return response.data;
}
