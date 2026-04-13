/**
 * @fileoverview Hook liste + CRUD des plans préventifs
 * @module hooks/preventive/usePreventivePlans
 */

import { useCallback, useEffect, useState } from 'react';
import {
  fetchPreventivePlans,
  createPreventivePlan,
  updatePreventivePlan,
  deletePreventivePlan,
  patchPreventivePlanSteps,
} from '@/api/preventivePlans';

export function usePreventivePlans({ active_only = true } = {}) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPreventivePlans({ active_only });
      setPlans(data);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des plans préventifs');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [active_only]);

  useEffect(() => { load(); }, [load]);

  const createPlan = useCallback(async (payload) => {
    const created = await createPreventivePlan(payload);
    await load();
    return created;
  }, [load]);

  const updatePlan = useCallback(async (id, payload) => {
    const updated = await updatePreventivePlan(id, payload);
    setPlans((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  }, []);

  const deactivatePlan = useCallback(async (id) => {
    await deletePreventivePlan(id);
    await load();
  }, [load]);

  const saveSteps = useCallback(async (id, steps) => {
    const updated = await patchPreventivePlanSteps(id, steps);
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, steps: updated } : p)));
    return updated;
  }, []);

  return { plans, loading, error, refresh: load, createPlan, updatePlan, deactivatePlan, saveSteps };
}
