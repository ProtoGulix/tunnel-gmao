/**
 * Hook for purchase requests list management
 *
 * @module hooks/purchase/usePurchaseRequests
 */

import { useCallback, useEffect, useState } from 'react';
import {
  fetchPurchaseRequests,
  fetchPurchaseRequestStats,
  createPurchaseRequest,
  updatePurchaseRequest,
  deletePurchaseRequest,
  dispatchPurchaseRequests,
} from '@/api/purchaseRequests';

/**
 * @param {Object} options
 * @param {string} [options.initialStatus]
 * @param {string} [options.initialUrgency]
 * @param {string} [options.initialSearch]
 */
export function usePurchaseRequests({ initialStatus = '', initialUrgency = '', initialSearch = '' } = {}) {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [status, setStatus] = useState(initialStatus);
  const [urgency, setUrgency] = useState(initialUrgency);
  const [search, setSearch] = useState(initialSearch);

  const [dispatching, setDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState(null);

  const buildParams = useCallback(() => {
    const params = {};
    if (status) params.status = status;
    if (urgency) params.urgency = urgency;
    if (search) params.search = search;
    return params;
  }, [status, urgency, search]);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPurchaseRequests(buildParams());
      setItems(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const data = await fetchPurchaseRequestStats();
      setStats(data);
    } catch {
      // Stats are non-blocking
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const createItem = useCallback(async (payload) => {
    const created = await createPurchaseRequest(payload);
    await loadItems();
    await loadStats();
    return created;
  }, [loadItems, loadStats]);

  const editItem = useCallback(async (id, updates) => {
    const updated = await updatePurchaseRequest(id, updates);
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updated } : item)));
    await loadStats();
    return updated;
  }, [loadStats]);

  const removeItem = useCallback(async (id) => {
    await deletePurchaseRequest(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    await loadStats();
  }, [loadStats]);

  const dispatch = useCallback(async () => {
    setDispatching(true);
    setDispatchResult(null);
    try {
      const result = await dispatchPurchaseRequests();
      const hasErrors = result.errors?.length > 0;
      const dispatched = result.dispatched_count ?? 0;
      setDispatchResult({
        type: dispatched > 0 ? (hasErrors ? 'warning' : 'success') : 'error',
        message: dispatched > 0
          ? `${dispatched} demande${dispatched > 1 ? 's' : ''} dispatchée${dispatched > 1 ? 's' : ''}`
          : 'Aucune demande dispatchée',
        dispatched,
        createdOrders: result.created_orders ?? 0,
        errors: result.errors?.length ?? 0,
      });
      await loadItems();
      await loadStats();
    } catch (err) {
      setDispatchResult({
        type: 'error',
        message: err?.message || 'Erreur lors du dispatch',
        dispatched: 0,
        createdOrders: 0,
        errors: 0,
      });
    } finally {
      setDispatching(false);
    }
  }, [loadItems, loadStats]);

  // Count from stats (global, not affected by current tab filter)
  const readyToDispatch = stats?.by_status?.find(
    (s) => s.status === 'PENDING_DISPATCH'
  )?.count ?? items.filter((item) => item.derived_status?.code === 'PENDING_DISPATCH').length;

  return {
    items,
    stats,
    loading,
    statsLoading,
    error,
    search,
    setSearch,
    status,
    setStatus,
    urgency,
    setUrgency,
    refresh: loadItems,
    createItem,
    editItem,
    removeItem,
    dispatching,
    dispatchResult,
    setDispatchResult,
    dispatch,
    readyToDispatch,
  };
}
