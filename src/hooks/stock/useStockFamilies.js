/**
 * @fileoverview Hook stock families
 * @module hooks/stock/useStockFamilies
 */

import { useCallback, useEffect, useState } from 'react';
import { fetchStockFamilies } from '@/api/stock';

export function useStockFamilies() {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadFamilies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchStockFamilies();
      setFamilies(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des familles');
      setFamilies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFamilies();
  }, [loadFamilies]);

  return {
    families,
    loading,
    error,
    refresh: loadFamilies,
  };
}
