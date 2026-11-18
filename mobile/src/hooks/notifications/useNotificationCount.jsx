import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { fetchUnreadCount } from '../../api/notifications'

const UNREAD_COUNT_POLL_MS = 30000

const NotificationCountContext = createContext({ count: 0, refresh: () => {} })

/**
 * Relevé unique du compteur des non lues pour toute l'application (toutes les 30 s).
 * Monté par AppShell, donc seulement quand l'utilisateur est connecté.
 */
export function NotificationCountProvider({ children }) {
  const [count, setCount] = useState(0)

  const refresh = useCallback(() => {
    return fetchUnreadCount()
      .then(setCount)
      .catch(() => {}) // garde la valeur précédente sur erreur transitoire
  }, [])

  useEffect(() => {
    refresh()
    const interval = setInterval(refresh, UNREAD_COUNT_POLL_MS)
    return () => clearInterval(interval)
  }, [refresh])

  const value = useMemo(() => ({ count, refresh }), [count, refresh])
  return <NotificationCountContext.Provider value={value}>{children}</NotificationCountContext.Provider>
}

/** Compteur partagé et fonction de relevé immédiat (après un marquage ou un masquage). */
export function useNotificationCount() {
  return useContext(NotificationCountContext)
}
