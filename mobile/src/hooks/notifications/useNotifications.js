import { useState, useEffect, useCallback } from 'react'
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../api/notifications'

/** Liste des notifications de l'utilisateur, marquage lu avec mise à jour optimiste. */
export function useNotifications() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    fetchNotifications()
      .then(({ items: page }) => setItems(page))
      .catch((err) => setError(err?.data?.detail ?? err?.message ?? 'Erreur inconnue'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const markRead = useCallback((id) => {
    const now = new Date().toISOString()
    setItems((prev) => prev.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: now } : n)))
    return markNotificationRead(id).catch(() => {})
  }, [])

  const markAllRead = useCallback(() => {
    const now = new Date().toISOString()
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })))
    return markAllNotificationsRead().catch(() => load())
  }, [load])

  const unread = items.filter((n) => !n.read_at).length

  return { items, unread, loading, error, reload: load, markRead, markAllRead }
}
