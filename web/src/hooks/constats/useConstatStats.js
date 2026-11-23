/**
 * @fileoverview Chargement des indicateurs des constats sur une période
 * @module hooks/constats/useConstatStats
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchConstatStats } from '@/api/constatStats';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

/**
 * @param {string} startDate - AAAA-MM-JJ
 * @param {string} endDate - AAAA-MM-JJ
 * @returns {{ data: Object|null, loading: boolean, error: string|null, reload: Function }}
 */
export function useConstatStats(startDate, endDate) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const current = ++requestId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetchConstatStats({ startDate, endDate });
      if (current === requestId.current) setState({ data, loading: false, error: null });
    } catch (err) {
      if (current !== requestId.current) return;
      setState({ data: null, loading: false, error: extractApiErrorMessage(err, 'Erreur lors du chargement des constats') });
    }
  }, [startDate, endDate]);

  useEffect(() => { load(); }, [load]);

  return { ...state, reload: load };
}
