import { useState, useEffect, useCallback } from 'react'
import { getIntervention } from '../../api/interventions'

export function useInterventionDetail(id) {
  const [intervention, setIntervention] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    getIntervention(id)
      .then(setIntervention)
      .catch(err => setError(err?.data?.detail ?? err.message))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  return { intervention, loading, error, reload: load }
}
