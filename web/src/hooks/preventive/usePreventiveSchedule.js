/**
 * @fileoverview Hook échéancier préventif (GET /preventive-occurrences/schedule)
 * @module hooks/preventive/usePreventiveSchedule
 */

import { useCallback, useEffect, useState } from 'react';
import { fetchPreventiveSchedule } from '@/api/preventiveOccurrences';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

/**
 * @param {Object} [filters] - machine_id, include_descendants, state
 * @param {boolean} [enabled=true] - false : aucun appel
 * @returns {{ items: Array, loading: boolean, error: string|null, refresh: Function }}
 */
export function usePreventiveSchedule(filters = {}, enabled = true) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);
  const key = JSON.stringify(filters);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchPreventiveSchedule(JSON.parse(key)));
    } catch (err) {
      setError(extractApiErrorMessage(err, "Erreur lors du chargement de l'échéancier"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [key, enabled]);

  useEffect(() => { load(); }, [load]);

  return { items, loading, error, refresh: load };
}
