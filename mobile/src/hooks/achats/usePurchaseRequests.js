import { useState, useEffect, useCallback } from 'react'
import { getPurchaseRequests, createPurchaseRequest } from '../../api/achats'
import { useApiStatus } from '../shared/useApiStatus'

export function usePurchaseRequests(filters = {}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const createStatus = useApiStatus()

  const filtersKey = JSON.stringify(filters)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    getPurchaseRequests(filters)
      .then(setItems)
      .catch(err => setError(err?.data?.detail ?? err.message))
      .finally(() => setLoading(false))
  }, [filtersKey]) // eslint-disable-line

  useEffect(() => { load() }, [load])

  const create = useCallback(async (data) => {
    const result = await createStatus.run(createPurchaseRequest(data))
    setItems(prev => [result, ...prev])
    return result
  }, [createStatus])

  return { items, loading, error, create, createStatus, reload: load }
}
