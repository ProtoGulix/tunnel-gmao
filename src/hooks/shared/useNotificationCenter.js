/**
 * @fileoverview Hook d'état pour le centre de notifications (badge sidebar + dropdown)
 * @module hooks/shared/useNotificationCenter
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/api/notifications';

const UNREAD_COUNT_POLL_MS = 30000;
const PAGE_SIZE = 20;

/**
 * Gère l'état du centre de notifications : compteur non lu (pollé en permanence,
 * même pattern que useSidebarState) et liste paginée (chargée à la demande, seulement
 * à l'ouverture du dropdown — pas de polling de la liste complète).
 *
 * @returns {Object} état et actions du centre de notifications
 * @returns {Array<Object>} returns.items - Notifications chargées, triées par date décroissante
 * @returns {number} returns.unreadCount - Nombre de notifications non lues
 * @returns {boolean} returns.loading - Chargement de la liste en cours
 * @returns {boolean} returns.hasMore - Une page supplémentaire est disponible
 * @returns {Function} returns.loadFirstPage - (Re)charge la première page (ouverture du dropdown)
 * @returns {Function} returns.loadMore - Charge la page suivante
 * @returns {Function} returns.markRead - Marque une notification lue (maj optimiste)
 * @returns {Function} returns.markAllRead - Marque tout lu (maj optimiste)
 */
export function useNotificationCenter() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const offsetRef = useRef(0);

  // Polling du compteur non lu — même pattern que useSidebarState (loadSummary/interval).
  useEffect(() => {
    const loadCount = async () => {
      try {
        const count = await fetchUnreadCount();
        setUnreadCount(count);
      } catch {
        // Garde le compteur existant sur erreur transitoire.
      }
    };

    loadCount();
    const interval = setInterval(loadCount, UNREAD_COUNT_POLL_MS);
    return () => clearInterval(interval);
  }, []);

  const loadFirstPage = useCallback(async () => {
    setLoading(true);
    try {
      const { items: page, total } = await fetchNotifications({ limit: PAGE_SIZE, offset: 0 });
      setItems(page);
      offsetRef.current = page.length;
      setHasMore(page.length < total);
    } catch {
      // Garde la liste existante sur erreur transitoire.
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { items: page, total } = await fetchNotifications({
        limit: PAGE_SIZE,
        offset: offsetRef.current,
      });
      setItems((prev) => [...prev, ...page]);
      offsetRef.current += page.length;
      setHasMore(offsetRef.current < total);
    } catch {
      // Garde la liste existante sur erreur transitoire.
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const markRead = useCallback(async (id) => {
    const target = items.find((n) => n.id === id);
    const wasUnread = target && !target.read_at;

    // Maj optimiste de la liste et du compteur.
    setItems((prev) =>
      prev.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: new Date().toISOString() } : n))
    );
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await markNotificationRead(id);
    } catch {
      // Échec silencieux : le prochain poll du compteur / réouverture du dropdown
      // resynchronisera l'état réel.
    }
  }, [items]);

  const markAllRead = useCallback(async () => {
    const now = new Date().toISOString();
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })));
    setUnreadCount(0);

    try {
      await markAllNotificationsRead();
    } catch {
      // Échec silencieux : resynchronisation via le prochain poll.
    }
  }, []);

  return {
    items,
    unreadCount,
    loading,
    hasMore,
    loadFirstPage,
    loadMore,
    markRead,
    markAllRead,
  };
}
