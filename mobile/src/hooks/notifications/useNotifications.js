import { useState, useEffect, useCallback, useRef } from 'react'
import { useNotificationCount } from './useNotificationCount'
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification,
  dismissNotifications,
} from '../../api/notifications'

const PAGE_SIZE = 50
const MAX_PAGE_SIZE = 100 // limite de l'API

// Ajoute des notifications à la liste sans doublon (par id), en gardant l'ordre du serveur.
function mergeById(prev, more) {
  const seen = new Set(prev.map((n) => n.id))
  return [...prev, ...more.filter((n) => !seen.has(n.id))]
}

/** Liste paginée des notifications, marquage lu optimiste, compteur de la cloche tenu à jour. */
export function useNotifications() {
  const { refresh: refreshCount } = useNotificationCount()
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const loadedRef = useRef(0) // nombre déjà chargé, pour recharger autant après un masquage

  // Recharge depuis le début, en redemandant autant de notifications que déjà affichées.
  const load = useCallback(async () => {
    setError(null)
    const wanted = Math.max(loadedRef.current, PAGE_SIZE)
    try {
      let list = []
      let count = 0
      do {
        const page = await fetchNotifications({ limit: Math.min(MAX_PAGE_SIZE, wanted - list.length), offset: list.length })
        count = page.total
        list = mergeById(list, page.items)
        if (page.items.length === 0) break
      } while (list.length < wanted && list.length < count)
      setItems(list)
      setTotal(count)
      loadedRef.current = list.length
    } catch (err) {
      setError(err?.data?.detail ?? err?.message ?? 'Erreur inconnue')
    } finally {
      setLoading(false)
      refreshCount()
    }
  }, [refreshCount])

  useEffect(() => { load() }, [load])

  const loadMore = useCallback(async () => {
    setLoadingMore(true)
    try {
      const page = await fetchNotifications({ limit: PAGE_SIZE, offset: loadedRef.current })
      setItems((prev) => {
        const next = mergeById(prev, page.items)
        loadedRef.current = next.length
        return next
      })
      setTotal(page.total)
    } catch (err) {
      setError(err?.data?.detail ?? err?.message ?? 'Erreur inconnue')
    } finally {
      setLoadingMore(false)
    }
  }, [])

  const markRead = useCallback((id) => {
    const now = new Date().toISOString()
    setItems((prev) => prev.map((n) => (n.id === id && !n.read_at ? { ...n, read_at: now } : n)))
    return markNotificationRead(id).catch(() => {}).finally(refreshCount)
  }, [refreshCount])

  const markAllRead = useCallback(() => {
    const now = new Date().toISOString()
    setItems((prev) => prev.map((n) => (n.read_at ? n : { ...n, read_at: now })))
    return markAllNotificationsRead().catch(() => load()).finally(refreshCount)
  }, [load, refreshCount])

  // Retrait local puis rechargement : l'état réel du serveur fait foi, sans décaler la pagination.
  const dismiss = useCallback((id) => {
    setItems((prev) => prev.filter((n) => n.id !== id))
    return dismissNotification(id).catch(() => {}).finally(load)
  }, [load])

  const dismissAll = useCallback((onlyRead) => {
    setItems((prev) => (onlyRead ? prev.filter((n) => !n.read_at) : []))
    return dismissNotifications(onlyRead).catch(() => {}).finally(load)
  }, [load])

  const unread = items.filter((n) => !n.read_at).length

  const hasMore = items.length < total

  return { items, unread, loading, loadingMore, hasMore, loadMore, error, reload: load, markRead, markAllRead, dismiss, dismissAll }
}
