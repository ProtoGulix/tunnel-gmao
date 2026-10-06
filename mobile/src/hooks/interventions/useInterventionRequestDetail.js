import { useState, useEffect, useCallback } from 'react'
import { getInterventionRequest } from '../../api/interventions'

export function useInterventionRequestDetail(id) {
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    getInterventionRequest(id)
      .then(setItem)
      .catch(err => setError(err?.data?.detail ?? err.message))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { load() }, [load])

  return { item, loading, error, reload: load }
}
