/**
 * @fileoverview Hook pour la liste paginée des demandes d'intervention
 * @module hooks/intervention-requests/useInterventionRequests
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchInterventionRequests } from '@/api/intervention-requests';
import { useDebounce } from '@/hooks/useDebounce';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

const DEFAULT_PAGE_SIZE = 50;

function buildParams({ page, pageSize, search, statut, machineId, isSystem }) {
  const params = {
    skip: (page - 1) * pageSize,
    limit: pageSize,
  };

  if (search.trim()) params.search = search.trim();
  if (statut) params.statut = statut;
  if (machineId) params.machineId = machineId;
  if (isSystem !== null && isSystem !== undefined) params.isSystem = isSystem;

  return params;
}

/**
 * Gère le chargement paginé, les filtres et les facets des demandes d'intervention.
 *
 * @param {Object} [options]
 * @param {string} [options.initialSearch=''] - Terme de recherche initial
 * @returns {Object} État et setters
 */
export function useInterventionRequests({ initialSearch = '' } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearchState] = useState(initialSearch);
  const [statut, setStatutState] = useState('');
  const [machineId, setMachineIdState] = useState('');
  const [isSystem, setIsSystemState] = useState(null); // null=toutes | true=système | false=humaines
  const [facets, setFacets] = useState({ statut: [] });
  const [refreshKey, setRefreshKey] = useState(0);

  const abortRef = useRef(null);
  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const ctrl = abortRef.current;

    setLoading(true);
    setError(null);

    fetchInterventionRequests(
      buildParams({ page, pageSize, search: debouncedSearch, statut, machineId, isSystem })
    )
      .then((data) => {
        if (ctrl.signal.aborted) return;
        setItems(data.items ?? []);
        setTotal(data.pagination?.total ?? 0);
        setTotalPages(data.pagination?.total_pages ?? 1);
        setFacets(data.facets ?? { statut: [] });
      })
      .catch((err) => {
        if (ctrl.signal.aborted) return;
        setError(extractApiErrorMessage(err, 'Erreur lors du chargement des demandes'));
        setItems([]);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });

    return () => ctrl.abort();
  }, [page, pageSize, debouncedSearch, statut, machineId, isSystem, refreshKey]);

  const setSearch = useCallback((v) => {
    setSearchState(v);
    setPage(1);
  }, []);
  const setStatut = useCallback((v) => {
    setStatutState(v);
    setPage(1);
  }, []);
  const setMachineId = useCallback((v) => {
    setMachineIdState(v);
    setPage(1);
  }, []);
  const setIsSystem = useCallback((v) => {
    setIsSystemState(v);
    setPage(1);
  }, []);
  const changePageSize = useCallback((s) => {
    setPageSizeState(s);
    setPage(1);
  }, []);
  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return {
    items,
    loading,
    error,
    search,
    setSearch,
    statut,
    setStatut,
    machineId,
    setMachineId,
    isSystem,
    setIsSystem,
    facets,
    page,
    setPage,
    pageSize,
    changePageSize,
    total,
    totalPages,
    refresh,
  };
}
