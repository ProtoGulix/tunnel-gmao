import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchManufacturerDetail } from '@/api/manufacturers';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

export function useManufacturerDetail(manufacturerId) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const load = useCallback(async () => {
    if (!manufacturerId) { setDetail(null); return; }
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const ctrl = abortRef.current;

    setLoading(true);
    setError(null);
    try {
      const data = await fetchManufacturerDetail(manufacturerId);
      if (!ctrl.signal.aborted) setDetail(data);
    } catch (err) {
      if (!ctrl.signal.aborted) setError(extractApiErrorMessage(err, 'Erreur lors du chargement du fabricant'));
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, [manufacturerId]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  return { detail, loading, error, refresh: load };
}
