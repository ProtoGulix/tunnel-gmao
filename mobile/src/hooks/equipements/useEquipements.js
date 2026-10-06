import { useEffect, useCallback } from 'react'
import { useState } from 'react'
import { getEquipements } from '../../api/equipements'
import { useDebounce } from '../shared/useDebounce'

export function useEquipements(filters = {}, search = '') {
  const [items, setItems] = useState([])
  const [facets, setFacets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const debouncedSearch = useDebounce(search, 600)
  const filtersKey = JSON.stringify({ ...filters, search: debouncedSearch })

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    const params = { ...filters }
    if (debouncedSearch) params.search = debouncedSearch
    getEquipements(params)
      .then(res => {
        setItems(res.items ?? [])
        setFacets(res.facets?.equipement_class ?? [])
      })
      .catch(err => setError(err?.data?.detail ?? err.message))
      .finally(() => setLoading(false))
  }, [filtersKey]) // eslint-disable-line

  useEffect(() => { load() }, [load])

  return { items, facets, loading, error, reload: load }
}
