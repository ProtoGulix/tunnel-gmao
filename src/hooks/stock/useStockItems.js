/**
 * @fileoverview Hook stock items
 * @module hooks/stock/useStockItems
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchStockItems } from '@/api/stock';
import { useDebounce } from '@/hooks/useDebounce';

const DEFAULT_PAGE_SIZE = 50;
const DEFAULT_TOTAL_PAGES = 1;

const buildParams = ({ page, pageSize, search, familyCode, subFamilyCode }) => {
  const params = {
    skip: (page - 1) * pageSize,
    limit: pageSize,
  };

  if (search.trim()) params.search = search.trim();
  if (familyCode) params.family_code = familyCode;
  if (subFamilyCode) params.sub_family_code = subFamilyCode;

  return params;
};

const getPaginationValues = (data, itemsCount) => {
  const nextPagination = data?.pagination || {};
  return {
    total: nextPagination.total ?? itemsCount,
    totalPages: nextPagination.total_pages ?? DEFAULT_TOTAL_PAGES,
  };
};

export function useStockItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(DEFAULT_TOTAL_PAGES);
  const [search, setSearch] = useState('');
  const [familyCode, setFamilyCode] = useState('');
  const [subFamilyCode, setSubFamilyCode] = useState('');
  const [facets, setFacets] = useState({ families: [] });
  const [refreshKey, setRefreshKey] = useState(0);

  const abortControllerRef = useRef(null);
  const debouncedSearch = useDebounce(search, 600);

  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    const currentController = abortControllerRef.current;

    const loadItems = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = buildParams({
          page,
          pageSize,
          search: debouncedSearch,
          familyCode,
          subFamilyCode,
        });

        const data = await fetchStockItems(params);
        if (currentController.signal.aborted) return;

        const nextItems = Array.isArray(data?.items) ? data.items : [];
        const nextPagination = getPaginationValues(data, nextItems.length);
        const nextFacets = data?.facets || { families: [] };

        setItems(nextItems);
        setTotal(nextPagination.total);
        setTotalPages(nextPagination.totalPages);
        setFacets(nextFacets);
      } catch (err) {
        if (currentController.signal.aborted) return;
        setError(err.message || 'Erreur lors du chargement des pieces');
        setItems([]);
        setTotal(0);
        setTotalPages(DEFAULT_TOTAL_PAGES);
      } finally {
        if (!currentController.signal.aborted) setLoading(false);
      }
    };

    loadItems();

    return () => {
      currentController.abort();
    };
  }, [page, pageSize, debouncedSearch, familyCode, subFamilyCode, refreshKey]);

  useEffect(() => {
    if (page !== 1) {
      setPage(1);
    }
  }, [debouncedSearch, familyCode, subFamilyCode, page]);

  const changePageSize = useCallback((size) => {
    setPageSize(size);
    setPage(1);
  }, []);

  const refresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return {
    items,
    loading,
    error,
    search,
    setSearch,
    familyCode,
    setFamilyCode,
    subFamilyCode,
    setSubFamilyCode,
    facets,
    pagination: {
      total,
      page,
      pageSize,
      totalPages,
    },
    goToPage: setPage,
    changePageSize,
    refresh,
  };
}
