/**
 * @fileoverview Hook liste des pièces V4 (nouveau système /parts)
 * @module hooks/stock/useParts
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchParts, createPartWithSupplierRef, updatePart, deletePart } from '@/api/parts';
import { useDebounce } from '@/hooks/useDebounce';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

const DEFAULT_PAGE_SIZE = 50;

export function useParts({ initialSearch = '' } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearchState] = useState(initialSearch);
  const [familyCode, setFamilyCodeState] = useState('');
  const [subFamilyCode, setSubFamilyCodeState] = useState('');
  const [facets, setFacets] = useState({ families: [] });
  const [refreshKey, setRefreshKey] = useState(0);

  const abortRef = useRef(null);
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const ctrl = abortRef.current;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = { skip: (page - 1) * pageSize, limit: pageSize };
        if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
        if (familyCode) params.family_code = familyCode;
        if (subFamilyCode) params.sub_family_code = subFamilyCode;

        const data = await fetchParts(params);
        if (ctrl.signal.aborted) return;

        const nextItems = Array.isArray(data?.items) ? data.items : [];
        const pg = data?.pagination || {};
        setItems(nextItems);
        setTotal(pg.total ?? nextItems.length);
        setTotalPages(pg.total_pages ?? 1);
        setFacets(data?.facets || { families: [] });
      } catch (err) {
        if (ctrl.signal.aborted) return;
        setError(extractApiErrorMessage(err, 'Erreur lors du chargement des pièces'));
        setItems([]);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    };

    load();
    return () => ctrl.abort();
  }, [page, pageSize, debouncedSearch, familyCode, subFamilyCode, refreshKey]);

  const setSearch = useCallback((v) => { setSearchState(v); setPage(1); }, []);
  const setFamilyCode = useCallback((v) => { setFamilyCodeState(v); setPage(1); }, []);
  const setSubFamilyCode = useCallback((v) => { setSubFamilyCodeState(v); setPage(1); }, []);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  const createItem = useCallback(async (payload) => {
    const created = await createPartWithSupplierRef(payload);
    setRefreshKey((k) => k + 1);
    return created;
  }, []);

  const editItem = useCallback(async (id, updates) => {
    const updated = await updatePart(id, updates);
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...updated } : it)));
    return updated;
  }, []);

  const removeItem = useCallback(async (id) => {
    await deletePart(id);
    setItems((prev) => prev.filter((it) => it.id !== id));
  }, []);

  return {
    items, loading, error,
    search, setSearch,
    familyCode, setFamilyCode,
    subFamilyCode, setSubFamilyCode,
    facets,
    pagination: { total, page, pageSize, totalPages },
    goToPage: setPage,
    refresh,
    createItem, editItem, removeItem,
  };
}
