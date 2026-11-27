/**
 * @fileoverview Bilan des demandes à qualifier, filtrable par site (ADR 0046).
 * @module hooks/home/useDemandeStats
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchDemandeStats } from '@/api/demandeStats';

export function useDemandeStats({ siteId } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await fetchDemandeStats({ siteId }));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [siteId]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}
