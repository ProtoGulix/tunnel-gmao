import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../auth/AuthContext'
import { getMyTasks } from '../../api/tasks'

/**
 * Tâches assignées au technicien connecté (todo + in_progress).
 */
export function useMyTasks() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    if (!user?.id) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    getMyTasks(user.id)
      .then(setItems)
      .catch((err) => setError(err?.data?.detail ?? err.message))
      .finally(() => setLoading(false))
  }, [user?.id])

  useEffect(() => { load() }, [load])

  return { items, loading, error, reload: load }
}
