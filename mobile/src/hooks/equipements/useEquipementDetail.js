import { useState, useEffect } from 'react'
import { getEquipement } from '../../api/equipements'

export function useEquipementDetail(id) {
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(null)
    getEquipement(id)
      .then(setItem)
      .catch(err => setError(err?.data?.detail ?? err.message))
      .finally(() => setLoading(false))
  }, [id])

  return { item, loading, error }
}
