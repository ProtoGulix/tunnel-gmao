import { useCallback } from 'react';
import { fetchStockSubFamilies, updateStockSubFamily } from '@/api/stock';
import { useFetchList } from '@/hooks/shared/useFetchList';

export function useStockSubFamilies() {
  const { items: subFamilies, setItems: setSubFamilies, loading, error, refresh } = useFetchList(
    fetchStockSubFamilies,
    'Erreur lors du chargement des sous-familles'
  );

  const updateSubFamily = useCallback(async (familyCode, subFamilyCode, updates) => {
    const updated = await updateStockSubFamily(familyCode, subFamilyCode, updates);
    setSubFamilies((prev) =>
      prev.map((item) =>
        item.family_code === familyCode && item.code === subFamilyCode ? updated : item
      )
    );
    return updated;
  }, [setSubFamilies]);

  return { subFamilies, loading, error, refresh, updateSubFamily };
}
