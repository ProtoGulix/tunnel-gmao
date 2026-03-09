/**
 * @fileoverview Hook stock family detail with search
 * @module hooks/stock/useStockFamilyDetail
 */

import { useCallback, useEffect, useState } from 'react';
import { fetchStockFamilyDetail, updateStockSubFamily, createStockSubFamily } from '@/api/stock';
import { useDebounce } from '@/hooks/useDebounce';

export function useStockFamilyDetail(familyCode) {
  const [family, setFamily] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 600);

  const loadFamily = useCallback(
    async (params = {}) => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchStockFamilyDetail(familyCode, params);
        setFamily(data || null);
      } catch (err) {
        setError(err.message || 'Erreur lors du chargement de la famille');
        setFamily(null);
      } finally {
        setLoading(false);
      }
    },
    [familyCode]
  );

  useEffect(() => {
    loadFamily({ search: debouncedSearch || undefined });
  }, [debouncedSearch, loadFamily]);

  const updateSubFamily = useCallback(
    async (subFamilyCode, updates) => {
      const updated = await updateStockSubFamily(familyCode, subFamilyCode, updates);
      setFamily((prev) =>
        prev
          ? {
              ...prev,
              sub_families: prev.sub_families.map((item) =>
                item.code === subFamilyCode ? updated : item
              ),
            }
          : null
      );
      return updated;
    },
    [familyCode]
  );

  const addSubFamily = useCallback(
    async (data) => {
      const created = await createStockSubFamily(familyCode, data);
      setFamily((prev) =>
        prev ? { ...prev, sub_families: [...(prev.sub_families || []), created] } : null
      );
      return created;
    },
    [familyCode]
  );

  return {
    family,
    subFamilies: family?.sub_families || [],
    loading,
    error,
    search,
    setSearch,
    stats: {
      total: family?.sub_family_count || 0,
      withTemplate: family?.with_template_count || 0,
      withoutTemplate: family?.without_template_count || 0,
    },
    refresh: () => loadFamily({ search: debouncedSearch || undefined }),
    updateSubFamily,
    createSubFamily: addSubFamily,
  };
}
