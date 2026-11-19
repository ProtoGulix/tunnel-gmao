/**
 * @fileoverview Hook historique préventif d'une machine (GET /preventive-occurrences/history)
 * @module hooks/preventive/usePreventiveHistory
 */

import { useCallback, useEffect, useState } from 'react';
import { fetchPreventiveHistory } from '@/api/preventiveOccurrences';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

/**
 * @param {string} machineId
 * @param {boolean} [enabled=true] - false : aucun appel
 * @returns {{ items: Array, loading: boolean, error: string|null, refresh: Function }}
 */
export function usePreventiveHistory(machineId, enabled = true) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!enabled || !machineId) return;
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchPreventiveHistory(machineId));
    } catch (err) {
      setError(extractApiErrorMessage(err, "Erreur lors du chargement de l'historique"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [machineId, enabled]);

  useEffect(() => { load(); }, [load]);

  return { items, loading, error, refresh: load };
}
