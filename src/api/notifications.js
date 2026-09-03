/**
 * Notifications API Layer
 *
 * Appels HTTP bruts vers /notifications — centre de notifications (DI à traiter,
 * pointage demandé, intervention à clôturer, échéance préventif...).
 * Aucune logique métier — le backend retourne les données prêtes à l'emploi.
 */

import { api } from '@/lib/api/client';

/**
 * Récupère une page de notifications, triées par date décroissante par le backend.
 *
 * Code défensivement : le backend peut renvoyer soit { items, total }, soit un
 * tableau brut (selon la version de l'endpoint) — les deux formes sont acceptées.
 *
 * @param {Object} [params]
 * @param {number} [params.limit=20] - Nombre de résultats
 * @param {number} [params.offset=0] - Offset de pagination
 * @returns {Promise<{items: Array<Object>, total: number}>}
 */
export async function fetchNotifications({ limit = 20, offset = 0 } = {}) {
  const response = await api.get('/notifications', { params: { limit, offset } });
  const payload = response.data;

  if (Array.isArray(payload)) {
    return { items: payload, total: payload.length };
  }
  const items = payload?.items ?? [];
  const total = typeof payload?.total === 'number' ? payload.total : items.length;
  return { items, total };
}

/**
 * Récupère le nombre de notifications non lues, pour badge de la sidebar.
 * @returns {Promise<number>}
 */
export async function fetchUnreadCount() {
  const response = await api.get('/notifications/unread-count');
  const payload = response.data;
  return Number(payload?.count ?? 0);
}

/**
 * Marque une notification comme lue.
 * @param {string} id - UUID de la notification
 * @returns {Promise<void>}
 */
export async function markNotificationRead(id) {
  await api.patch(`/notifications/${id}/read`);
}

/**
 * Marque toutes les notifications comme lues.
 * @returns {Promise<void>}
 */
export async function markAllNotificationsRead() {
  await api.patch('/notifications/read-all');
}

/**
 * Déclenche une demande de pointage auprès d'un ou plusieurs techniciens
 * pour une intervention donnée.
 *
 * @param {string} interventionId - UUID de l'intervention
 * @param {string[]} techIds - UUIDs des techniciens sollicités
 * @returns {Promise<void>}
 */
export async function requestPointage(interventionId, techIds) {
  await api.post(`/interventions/${interventionId}/request-pointage`, { tech_ids: techIds });
}
