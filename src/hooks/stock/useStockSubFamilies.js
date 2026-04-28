/**
 * @fileoverview Hook stock sub families
 * @module hooks/stock/useStockSubFamilies
 */

import { useCallback, useEffect, useState } from 'react';
import { fetchStockSubFamilies, updateStockSubFamily } from '@/api/stock';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

export function useStockSubFamilies() {
  const [subFamilies, setSubFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSubFamilies = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchStockSubFamilies();
      setSubFamilies(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Erreur lors du chargement des sous-familles'));
      setSubFamilies([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubFamilies();
  }, [loadSubFamilies]);

  const patchSubFamily = useCallback(async (familyCode, subFamilyCode, updates) => {
    const updated = await updateStockSubFamily(familyCode, subFamilyCode, updates);
    setSubFamilies((prev) =>
      prev.map((item) =>
        item.family_code === familyCode && item.code === subFamilyCode ? updated : item
      )
    );
    return updated;
  }, []);

  return {
    subFamilies,
    loading,
    error,
    refresh: loadSubFamilies,
    updateSubFamily: patchSubFamily,
  };
}
