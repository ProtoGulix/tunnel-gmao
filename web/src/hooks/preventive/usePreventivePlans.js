import { useCallback } from 'react';
import {
  fetchPreventivePlans,
  createPreventivePlan,
  updatePreventivePlan,
  deletePreventivePlan,
  patchPreventivePlanSteps,
} from '@/api/preventivePlans';
import { useFetchList } from '@/hooks/shared/useFetchList';

export function usePreventivePlans({ active_only = true } = {}) {
  const fetchFn = useCallback(() => fetchPreventivePlans({ active_only }), [active_only]);
  const { items: plans, setItems: setPlans, loading, error, refresh } = useFetchList(
    fetchFn,
    'Erreur lors du chargement des plans préventifs',
    [active_only]
  );

  const createPlan = useCallback(async (payload) => {
    const created = await createPreventivePlan(payload);
    await refresh();
    return created;
  }, [refresh]);

  const updatePlan = useCallback(async (id, payload) => {
    const updated = await updatePreventivePlan(id, payload);
    setPlans((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  }, [setPlans]);

  const deactivatePlan = useCallback(async (id) => {
    await deletePreventivePlan(id);
    await refresh();
  }, [refresh]);

  const saveSteps = useCallback(async (id, steps) => {
    const updated = await patchPreventivePlanSteps(id, steps);
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, steps: updated } : p)));
    return updated;
  }, [setPlans]);

  return { plans, loading, error, refresh, createPlan, updatePlan, deactivatePlan, saveSteps };
}
