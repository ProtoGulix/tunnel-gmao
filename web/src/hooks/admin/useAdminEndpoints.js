/**
 * @fileoverview Hook catalogue des endpoints admin
 * @module hooks/admin/useAdminEndpoints
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAdminEndpoints, updateAdminEndpoint, syncAdminEndpoints } from '@/api/adminEndpoints';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

export function useAdminEndpoints() {
  const [endpoints, setEndpoints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterModule, setFilterModuleState] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const abortRef = useRef(null);

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const ctrl = abortRef.current;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = {};
        if (filterModule) params.module = filterModule;
        const data = await fetchAdminEndpoints(params);
        if (ctrl.signal.aborted) return;
        setEndpoints(Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []);
      } catch (err) {
        if (ctrl.signal.aborted) return;
        setError(extractApiErrorMessage(err, 'Erreur lors du chargement des endpoints'));
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    };

    load();
    return () => ctrl.abort();
  }, [filterModule, refreshKey]);

  const setFilterModule = useCallback((v) => setFilterModuleState(v), []);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const editEndpoint = useCallback(async (id, payload) => {
    const updated = await updateAdminEndpoint(id, payload);
    setEndpoints((prev) => prev.map((e) => (e.id === id ? { ...e, ...updated } : e)));
    return updated;
  }, []);

  const syncEndpoints = useCallback(async () => {
    const result = await syncAdminEndpoints();
    setRefreshKey((k) => k + 1);
    return result;
  }, []);

  // Extraire les modules uniques pour le filtre
  const modules = [...new Set(endpoints.map((e) => e.module).filter(Boolean))].sort();

  return {
    endpoints,
    loading,
    error,
    filterModule,
    setFilterModule,
    modules,
    refresh,
    editEndpoint,
    syncEndpoints,
  };
}
