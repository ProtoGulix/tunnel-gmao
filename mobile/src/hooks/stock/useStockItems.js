import { useState, useEffect, useCallback, useRef } from 'react'
import { getStockItems } from '../../api/stock'
import { useDebounce } from '../shared/useDebounce'

export function useStockItems({ search = '', familyCode = '', subFamilyCode = '' } = {}) {
  const [items, setItems] = useState([])
  const [facets, setFacets] = useState(null)
  // Les facettes complètes (sans filtre famille) sont mémorisées pour que
  // sub_families reste disponible même après sélection d'une famille.
  const fullFacetsRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const debouncedSearch = useDebounce(search, 350)

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    getStockItems({ search: debouncedSearch, family_code: familyCode, sub_family_code: subFamilyCode })
      .then(res => {
        setItems(res.items ?? [])
        const incoming = res.facets ?? null
        // On ne met à jour les facettes que si on n'a pas de filtre famille actif,
        // pour préserver les sub_families dans tous les cas.
        if (!familyCode && !subFamilyCode) {
          fullFacetsRef.current = incoming
          setFacets(incoming)
        } else {
          // Conserver les facettes complètes mais mettre à jour les compteurs
          setFacets(fullFacetsRef.current ?? incoming)
        }
      })
      .catch(err => setError(err?.data?.detail ?? err.message))
      .finally(() => setLoading(false))
  }, [debouncedSearch, familyCode, subFamilyCode])

  useEffect(() => { load() }, [load])

  return { items, facets, loading, error, reload: load }
}
