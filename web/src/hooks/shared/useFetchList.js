import { useCallback, useEffect, useRef, useState } from 'react';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

/**
 * Hook de base pour charger une liste depuis l'API.
 * Gère : loading, error, AbortController, refresh.
 *
 * @param {Function} fetchFn - Fonction async () => data[]
 * @param {string} errMsg - Message d'erreur fallback
 * @param {Array} deps - Dépendances supplémentaires déclenchant un rechargement
 */
export function useFetchList(fetchFn, errMsg, deps = []) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const load = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const ctrl = abortRef.current;

    setLoading(true);
    setError(null);
    try {
      const data = await fetchFn();
      if (ctrl.signal.aborted) return;
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      if (ctrl.signal.aborted) return;
      setError(extractApiErrorMessage(err, errMsg));
      setItems([]);
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchFn, ...deps]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  return { items, setItems, loading, error, refresh: load };
}
