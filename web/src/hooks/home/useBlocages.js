/**
 * @fileoverview Interventions bloquées chez l'acheteur ou la production, filtrables par site (ADR 0047).
 * @module hooks/home/useBlocages
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchBlocages } from '@/api/blocages';

export function useBlocages({ siteId } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await fetchBlocages({ siteId }));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}
