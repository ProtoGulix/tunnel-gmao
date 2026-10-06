/**
 * @fileoverview Hooks sécurité admin (logs, blocklist, domaines)
 * @module hooks/admin/useAdminSecurity
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as secApi from '@/api/adminSecurity';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

// ---- Logs de sécurité avec auto-refresh 30s ----
export function useSecurityLogs({ eventType = '', startDate = '', endDate = '' } = {}) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const PAGE_SIZE = 50;

  const abortRef = useRef(null);
  const intervalRef = useRef(null);

  const load = useCallback(
    async (silent = false) => {
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      const ctrl = abortRef.current;

      if (!silent) setLoading(true);
      setError(null);
      try {
        const params = { skip: (page - 1) * PAGE_SIZE, limit: PAGE_SIZE };
        if (eventType) params.event_type = eventType;
        if (startDate) params.start_date = startDate;
        if (endDate) params.end_date = endDate;

        const data = await secApi.fetchSecurityLogs(params);
        if (ctrl.signal.aborted) return;

        const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
        setLogs(items);
        setTotal(data?.pagination?.total ?? items.length);
        setTotalPages(data?.pagination?.total_pages ?? 1);
      } catch (err) {
        if (ctrl.signal.aborted) return;
        setError(extractApiErrorMessage(err, 'Erreur lors du chargement des logs'));
      } finally {
        if (!ctrl.signal.aborted && !silent) setLoading(false);
      }
    },
    [page, eventType, startDate, endDate]
  );

  useEffect(() => {
    load();
    intervalRef.current = setInterval(() => load(true), 30000);
    return () => {
      clearInterval(intervalRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [load]);

  return {
    logs,
    loading,
    error,
    pagination: { total, page, pageSize: PAGE_SIZE, totalPages },
    goToPage: setPage,
    refresh: () => load(),
  };
}

// ---- IP Blocklist ----
export function useIpBlocklist() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    secApi
      .fetchIpBlocklist()
      .then((data) =>
        setItems(Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [])
      )
      .catch((err) => setError(extractApiErrorMessage(err, 'Erreur chargement blocklist')))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const blockIp = useCallback(async (payload) => {
    const created = await secApi.createIpBlock(payload);
    setRefreshKey((k) => k + 1);
    return created;
  }, []);

  const unblockIp = useCallback(async (id) => {
    await secApi.deleteIpBlock(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { items, loading, error, blockIp, unblockIp, refresh: () => setRefreshKey((k) => k + 1) };
}

// ---- Domaines email ----
export function useEmailDomainRules() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    secApi
      .fetchEmailDomainRules()
      .then((data) =>
        setItems(Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [])
      )
      .catch((err) => setError(extractApiErrorMessage(err, 'Erreur chargement domaines')))
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const addDomain = useCallback(async (payload) => {
    const created = await secApi.createEmailDomainRule(payload);
    setRefreshKey((k) => k + 1);
    return created;
  }, []);

  const removeDomain = useCallback(async (id) => {
    await secApi.deleteEmailDomainRule(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { items, loading, error, addDomain, removeDomain };
}

// ---- Clés API ----
export function useApiKeys() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await secApi.fetchApiKeys();
      setItems(Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : []);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Erreur chargement clés API'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createKey = useCallback(async (payload) => {
    const created = await secApi.createApiKey(payload);
    setItems((prev) => [created, ...prev]);
    return created;
  }, []);

  const patchKey = useCallback(async (id, payload) => {
    const updated = await secApi.updateApiKey(id, payload);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updated } : i)));
    return updated;
  }, []);

  const revokeKey = useCallback(async (id) => {
    await secApi.deleteApiKey(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return { items, loading, error, createKey, patchKey, revokeKey, refresh: load };
}
