import { useState, useCallback, useEffect } from 'react';
import { fetchAuditLogs, fetchAllAuditReasonCodes } from '@/api/auditLogs';

const PAGE_SIZE = 50;

export function useAdminAudit() {
  const [filters, setFilters] = useState({
    entity_type: '',
    reason_code: '',
    decision_type: '',
    changed_by: '',
    from_dt: '',
    to_dt: '',
    exclude_system: true,
  });
  const [page, setPage] = useState(0);
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, total_pages: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reasonCodes, setReasonCodes] = useState([]);

  useEffect(() => {
    fetchAllAuditReasonCodes().then(setReasonCodes).catch(() => {});
  }, []);

  const load = useCallback(async (overrideFilters = filters, overridePage = page) => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        limit: PAGE_SIZE,
        offset: overridePage * PAGE_SIZE,
        exclude_system: overrideFilters.exclude_system ?? true,
      };
      if (overrideFilters.entity_type)  params.entity_type  = overrideFilters.entity_type;
      if (overrideFilters.reason_code)  params.reason_code  = overrideFilters.reason_code;
      if (overrideFilters.decision_type) params.decision_type = overrideFilters.decision_type;
      if (overrideFilters.changed_by)   params.changed_by   = overrideFilters.changed_by;
      if (overrideFilters.from_dt) params.from_dt = overrideFilters.from_dt + 'T00:00:00Z';
      if (overrideFilters.to_dt)   params.to_dt   = overrideFilters.to_dt   + 'T23:59:59Z';

      const { items, pagination: pag } = await fetchAuditLogs(params);
      setLogs(items);
      setPagination(pag);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement des logs');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const applyFilters = useCallback((newFilters) => {
    setFilters(newFilters);
    setPage(0);
    load(newFilters, 0);
  }, [load]);

  const goToPage = useCallback((newPage) => {
    setPage(newPage);
    load(filters, newPage);
  }, [filters, load]);

  return {
    logs,
    total: pagination.total,
    totalPages: pagination.total_pages,
    loading,
    error,
    filters,
    page,
    pageSize: PAGE_SIZE,
    reasonCodes,
    applyFilters,
    goToPage,
    reload: () => load(),
  };
}
