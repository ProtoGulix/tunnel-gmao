/**
 * @fileoverview Hook liste et CRUD des fabricants avec pagination
 * @module hooks/suppliers/useManufacturers
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchManufacturers,
  createManufacturer,
  updateManufacturer,
  deleteManufacturer,
} from '@/api/manufacturers';
import { useDebounce } from '@/hooks/useDebounce';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

const DEFAULT_PAGE_SIZE = 25;

export function useManufacturers({ initialSearch = '' } = {}) {
  const [manufacturers, setManufacturers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearchState] = useState(initialSearch);
  const [page, setPageState] = useState(1);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const abortRef = useRef(null);
  const mountedRef = useRef(false);

  const debouncedSearch = useDebounce(search, 600);

  const load = useCallback(async (term = '', pg = 1, pgSize = DEFAULT_PAGE_SIZE) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const ctrl = abortRef.current;

    setLoading(true);
    setError(null);
    try {
      const params = { limit: pgSize, skip: (pg - 1) * pgSize };
      if (term) params.search = term;
      const { items, pagination } = await fetchManufacturers(params);
      if (!ctrl.signal.aborted) {
        setManufacturers(Array.isArray(items) ? items : []);
        setTotal(pagination?.total ?? 0);
      }
    } catch (err) {
      if (!ctrl.signal.aborted) setError(extractApiErrorMessage(err, 'Erreur lors du chargement des fabricants'));
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(initialSearch, 1, DEFAULT_PAGE_SIZE);
    mountedRef.current = true;
    return () => abortRef.current?.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!mountedRef.current) return;
    setPageState(1);
    load(debouncedSearch, 1, pageSize);
  }, [debouncedSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  const setSearch = useCallback((value) => {
    setSearchState(value);
    // Le fetch est déclenché via l'effet sur debouncedSearch
  }, []);

  const setPage = useCallback(
    (p) => {
      setPageState(p);
      load(search, p, pageSize);
    },
    [load, search, pageSize]
  );

  const changePageSize = useCallback(
    (ps) => {
      setPageSizeState(ps);
      setPageState(1);
      load(search, 1, ps);
    },
    [load, search]
  );

  const addManufacturer = useCallback(
    async (payload) => {
      const created = await createManufacturer(payload);
      await load(search, page, pageSize);
      return created;
    },
    [load, search, page, pageSize]
  );

  const editManufacturer = useCallback(async (id, payload) => {
    const updated = await updateManufacturer(id, payload);
    setManufacturers((prev) => prev.map((m) => (m.id === id ? { ...m, ...updated } : m)));
    return updated;
  }, []);

  const removeManufacturer = useCallback(
    async (id) => {
      await deleteManufacturer(id);
      await load(search, page, pageSize);
    },
    [load, search, page, pageSize]
  );

  return {
    manufacturers,
    total,
    page,
    pageSize,
    loading,
    error,
    search,
    setSearch,
    setPage,
    setPageSize: changePageSize,
    refresh: () => load(search, page, pageSize),
    createManufacturer: addManufacturer,
    updateManufacturer: editManufacturer,
    removeManufacturer,
  };
}
