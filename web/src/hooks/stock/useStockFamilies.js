import { useCallback } from 'react';
import { fetchStockFamilies, createStockFamily, updateStockFamily } from '@/api/stock';
import { useFetchList } from '@/hooks/shared/useFetchList';

export function useStockFamilies() {
  const { items: families, setItems: setFamilies, loading, error, refresh } = useFetchList(
    fetchStockFamilies,
    'Erreur lors du chargement des familles'
  );

  const createFamily = useCallback(async (data) => {
    const created = await createStockFamily(data);
    await refresh();
    return created;
  }, [refresh]);

  const updateFamily = useCallback(async (familyCode, data) => {
    const updated = await updateStockFamily(familyCode, data);
    setFamilies((prev) => prev.map((f) => (f.family_code === familyCode ? { ...f, ...updated } : f)));
    return updated;
  }, [setFamilies]);

  return { families, loading, error, refresh, createFamily, updateFamily };
}
