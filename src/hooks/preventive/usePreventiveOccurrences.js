/**
 * @fileoverview Hook liste des occurrences préventives avec filtres
 * @module hooks/preventive/usePreventiveOccurrences
 */

import { useCallback, useEffect, useState } from 'react';
import { fetchPreventiveOccurrences, skipPreventiveOccurrence, generatePreventiveOccurrences } from '@/api/preventiveOccurrences';

export function usePreventiveOccurrences(filters = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPreventiveOccurrences(filters);
      setItems(data);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des occurrences');
      setItems([]);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  useEffect(() => { load(); }, [load]);

  const skipOccurrence = useCallback(async (id, skip_reason) => {
    await skipPreventiveOccurrence(id, skip_reason);
    await load();
  }, [load]);

  const generate = useCallback(async () => {
    const result = await generatePreventiveOccurrences();
    await load();
    return result;
  }, [load]);

  return { items, loading, error, refresh: load, skipOccurrence, generate };
}
