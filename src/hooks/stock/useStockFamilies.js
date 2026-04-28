/**
 * @fileoverview Hook stock families
 * @module hooks/stock/useStockFamilies
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchStockFamilies, createStockFamily, updateStockFamily } from '@/api/stock';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

export function useStockFamilies() {
  const [families, setFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const initialLoadRef = useRef(false);

  const loadFamilies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchStockFamilies();
      setFamilies(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Erreur lors du chargement des familles'));
      setFamilies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      loadFamilies();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addFamily = useCallback(
    async (data) => {
      const created = await createStockFamily(data);
      await loadFamilies();
      return created;
    },
    [loadFamilies]
  );

  const editFamily = useCallback(async (familyCode, data) => {
    const updated = await updateStockFamily(familyCode, data);
    setFamilies((prev) =>
      prev.map((f) => (f.family_code === familyCode ? { ...f, ...updated } : f))
    );
    return updated;
  }, []);

  return {
    families,
    loading,
    error,
    refresh: loadFamilies,
    createFamily: addFamily,
    updateFamily: editFamily,
  };
}
