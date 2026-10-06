import { useState, useEffect, useCallback } from 'react'
import { getInterventionRequests, createInterventionRequest } from '../../api/interventions'
import { useApiStatus } from '../shared/useApiStatus'

export function useInterventionRequests(filters = {}) {
  const [items, setItems] = useState([])
  const [facets, setFacets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const createStatus = useApiStatus()

  const filtersKey = JSON.stringify(filters)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    getInterventionRequests(filters)
      .then(res => {
        setItems(res.items ?? res)
        setFacets(res.facets?.statut ?? [])
      })
      .catch(err => setError(err?.data?.detail ?? err.message))
      .finally(() => setLoading(false))
  }, [filtersKey]) // eslint-disable-line

  useEffect(() => { load() }, [load])

  const create = useCallback(async (data) => {
    const result = await createStatus.run(createInterventionRequest(data))
    setItems(prev => [result, ...prev])
    return result
  }, [createStatus])

  return { items, facets, loading, error, create, createStatus, reload: load }
}
