import { useState, useEffect } from 'react'
import { searchInterventions } from '../../api/interventions'
import { useDebounce } from '../shared/useDebounce'

export function useInterventionSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const debouncedQuery = useDebounce(query, 350)

  useEffect(() => {
    setLoading(true)
    setError(null)
    const params = { limit: 30, status: 'ouvert,en_cours,en_attente' }
    if (debouncedQuery.trim()) params.search = debouncedQuery.trim()
    searchInterventions(params)
      .then(setResults)
      .catch(err => setError(err?.data?.detail ?? err.message))
      .finally(() => setLoading(false))
  }, [debouncedQuery])

  return { query, setQuery, results, loading, error }
}
