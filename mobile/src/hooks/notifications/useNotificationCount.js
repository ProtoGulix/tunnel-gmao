import { useState, useEffect } from 'react'
import { fetchUnreadCount } from '../../api/notifications'

const UNREAD_COUNT_POLL_MS = 30000

/** Compteur des notifications non lues, relevé toutes les 30 s (comme le web). */
export function useNotificationCount() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let active = true
    const load = () => {
      fetchUnreadCount()
        .then((n) => { if (active) setCount(n) })
        .catch(() => {}) // garde la valeur précédente sur erreur transitoire
    }
    load()
    const interval = setInterval(load, UNREAD_COUNT_POLL_MS)
    return () => { active = false; clearInterval(interval) }
  }, [])

  return { count }
}
