import { useCallback } from 'react';
import * as equipementClassesApi from '@/api/equipementClasses';
import { useFetchList } from '@/hooks/shared/useFetchList';

export function useEquipementClasses() {
  const { items: classes, loading, error, refresh } = useFetchList(
    equipementClassesApi.fetchEquipementClasses,
    'Erreur lors du chargement des classes'
  );

  const createClass = useCallback(async (data) => {
    const created = await equipementClassesApi.createEquipementClass(data);
    await refresh();
    return created;
  }, [refresh]);

  const updateClass = useCallback(async (id, updates) => {
    const updated = await equipementClassesApi.updateEquipementClass(id, updates);
    await refresh();
    return updated;
  }, [refresh]);

  const deleteClass = useCallback(async (id) => {
    await equipementClassesApi.deleteEquipementClass(id);
    await refresh();
  }, [refresh]);

  return { classes, loading, error, refresh, createClass, updateClass, deleteClass };
}
