import { client, DEFAULT_PAGE_SIZE } from "../lib/api/client";

// Liste paginée { items, pagination: { total } } : le client ne la déplie pas.
export async function fetchNotifications({ limit = DEFAULT_PAGE_SIZE, offset = 0 } = {}) {
  const res = await client.get(`/notifications?limit=${limit}&skip=${offset}`);
  const items = Array.isArray(res) ? res : (res?.items ?? []);
  const total = res?.pagination?.total ?? items.length;
  return { items, total };
}

export async function fetchUnreadCount() {
  const res = await client.get("/notifications/unread-count");
  return Number(res?.count ?? 0);
}

export function markNotificationRead(id) {
  return client.patch(`/notifications/${id}/read`);
}

export function markAllNotificationsRead() {
  return client.patch("/notifications/read-all");
}

export function dismissNotification(id) {
  return client.delete(`/notifications/${id}`);
}

// onlyRead : true masque les lues, false masque toutes les notifications.
export function dismissNotifications(onlyRead) {
  return client.delete(`/notifications?only_read=${onlyRead}`);
}
