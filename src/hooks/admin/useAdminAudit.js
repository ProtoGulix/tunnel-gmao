import { useState, useCallback, useEffect } from 'react';
import { fetchAuditLogs, fetchAllAuditReasonCodes } from '@/api/auditLogs';

// L'API ne pagine pas — on charge par fenêtre de 200 et on pagine côté client
const PAGE_SIZE = 50;

export function useAdminAudit() {
  const [filters, setFilters] = useState({
    entity_type: '',
    reason_code: '',
    from_dt: '',
    to_dt: '',
  });
  const [page, setPage] = useState(0);
  const [allLogs, setAllLogs] = useState([]);   // tous les logs chargés
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reasonCodes, setReasonCodes] = useState([]);

  useEffect(() => {
    fetchAllAuditReasonCodes().then(setReasonCodes).catch(() => {});
  }, []);

  const load = useCallback(async (overrideFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      const params = { exclude_system: true, limit: 1000 };
      if (overrideFilters.entity_type) params.entity_type = overrideFilters.entity_type;
      if (overrideFilters.reason_code)  params.reason_code  = overrideFilters.reason_code;
      if (overrideFilters.from_dt) params.from_dt = overrideFilters.from_dt + 'T00:00:00Z';
      if (overrideFilters.to_dt)   params.to_dt   = overrideFilters.to_dt   + 'T23:59:59Z';
      const rows = await fetchAuditLogs(params);
      setAllLogs(rows);
      setPage(0);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des logs');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const applyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    load(newFilters);
  }, [load]);

  const total = allLogs.length;
  const logs  = allLogs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return {
    logs,
    total,
    loading,
    error,
    filters,
    page,
    pageSize: PAGE_SIZE,
    reasonCodes,
    applyFilters,
    goToPage: setPage,
    reload: () => load(),
  };
}
