/**
 * @fileoverview Logique de tri et cache pour useSupplierOrdersTable
 * @module components/purchase/orders/useSupplierOrdersTable/sorting
 */

import { useCallback, useMemo, useState } from 'react';
import { sortOrders } from '../supplierOrdersTableHelpers';

/**
 * Hook pour gérer le tri et la mise en cache des lignes
 */
export function useSortingAndCache(localOrders) {
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('desc');
  const [cachedLines, setCachedLines] = useState(new Map());

  const toggleSort = useCallback((key) => {
    setSortKey((prevKey) => {
      if (prevKey !== key) {
        setSortDir('desc');
        return key;
      }
      setSortDir((prevDir) => (prevDir === 'asc' ? 'desc' : 'asc'));
      return prevKey;
    });
  }, []);

  const sortedOrders = useMemo(
    () => sortOrders(localOrders, sortKey, sortDir),
    [localOrders, sortDir, sortKey]
  );

  const getOrderLines = useCallback(
    async (orderId, fetchFn, { forceRefresh = false } = {}) => {
      if (!forceRefresh && cachedLines.has(orderId)) {
        return cachedLines.get(orderId);
      }

      const lines = await fetchFn(orderId);
      setCachedLines((prev) => new Map(prev).set(orderId, lines));
      return lines;
    },
    [cachedLines]
  );

  return {
    sortKey,
    sortDir,
    toggleSort,
    sortedOrders,
    cachedLines,
    setCachedLines,
    getOrderLines,
  };
}
