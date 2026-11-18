import { useState, useEffect, useCallback } from 'react'
import { getSchedule } from '../../api/preventive'

/** Préventif à faire : plans en retard puis plans de la semaine (états calculés par l'API). */
export function usePreventiveSchedule() {
  const [overdue, setOverdue] = useState([])
  const [dueSoon, setDueSoon] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    Promise.all([getSchedule('overdue'), getSchedule('due_soon')])
      .then(([late, soon]) => { setOverdue(late); setDueSoon(soon) })
      .catch((err) => setError(err?.data?.detail ?? err?.message ?? 'Erreur inconnue'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  return { overdue, dueSoon, loading, error, reload: load }
}
