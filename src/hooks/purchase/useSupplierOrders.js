/**
 * Hook for supplier orders list management
 *
 * @module hooks/purchase/useSupplierOrders
 */

import { useCallback, useEffect, useState } from 'react';
import {
  fetchSupplierOrders,
  fetchSupplierOrderDetail,
  updateSupplierOrder,
  deleteSupplierOrder,
  fetchSupplierOrderLines,
  updateSupplierOrderLine,
} from '@/api/supplierOrders';

/**
 * @param {Object} options
 * @param {string} [options.status] - Filter by order status
 */
export function useSupplierOrders({ status = '' } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (status) params.status = status;
      const data = await fetchSupplierOrders(params);
      setItems(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const loadDetail = useCallback(async (id) => {
    return fetchSupplierOrderDetail(id);
  }, []);

  const loadLines = useCallback(async (orderId) => {
    return fetchSupplierOrderLines(orderId);
  }, []);

  const editOrder = useCallback(async (id, updates) => {
    const updated = await updateSupplierOrder(id, updates);
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, ...updated } : item)));
    return updated;
  }, []);

  const removeOrder = useCallback(async (id) => {
    await deleteSupplierOrder(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const editLine = useCallback(async (lineId, updates) => {
    return updateSupplierOrderLine(lineId, updates);
  }, []);

  return {
    items,
    loading,
    error,
    refresh: loadItems,
    loadDetail,
    loadLines,
    editOrder,
    removeOrder,
    editLine,
  };
}
