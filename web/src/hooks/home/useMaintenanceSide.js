/**
 * @fileoverview Côté maintenance : interventions sans action et préventifs en retard (comptes).
 * @module hooks/home/useMaintenanceSide
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchInterventions } from '@/api/interventions';
import { fetchPreventiveSchedule } from '@/api/preventiveOccurrences';

// Plafond de la liste : au-delà, le compte s'arrête là
export const IDLE_LIMIT = 200;

export function useMaintenanceSide({ siteId } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [idle, overdue] = await Promise.all([
        fetchInterventions({ limit: IDLE_LIMIT, idle: true, equipementId: siteId || undefined, includeDescendants: siteId ? true : undefined }),
        fetchPreventiveSchedule({ state: 'overdue', machine_id: siteId || undefined, include_descendants: siteId ? true : undefined }),
      ]);
      setData({ idle: idle.length, overdue: overdue.length });
    } catch (err) {
      setError(err);
    }
  }, [siteId]);

  useEffect(() => { load(); }, [load]);

  return { data, error, reload: load };
}
