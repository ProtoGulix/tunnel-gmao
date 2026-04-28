/**
 * Hook for supplier orders list management
 *
 * @module hooks/purchase/useSupplierOrders
 */

import { useCallback, useEffect, useState } from 'react';
import {
  fetchSupplierOrders,
  fetchSupplierOrderDetail,
  fetchSupplierOrderStatuses,
  updateSupplierOrder,
  deleteSupplierOrder,
  fetchSupplierOrderLines,
  updateSupplierOrderLine,
} from '@/api/supplierOrders';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

/**
 * @param {Object} options
 * @param {string} [options.status] - Filter by order status
 */
export function useSupplierOrders({ status = '' } = {}) {
  const [items, setItems] = useState([]);
  const [facets, setFacets] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (status) params.status = status;
      const {
        items: data,
        facets: facetData,
        pagination: paginationData,
      } = await fetchSupplierOrders(params);
      setItems(data);
      setFacets(facetData);
      setPagination(paginationData);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Erreur lors du chargement des commandes fournisseurs'));
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
    facets,
    pagination,
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

// Correspondance hex → token Radix (pour Button et DropdownMenu.Item qui ne supportent pas le hex)
const HEX_TO_RADIX = {
  '#3b82f6': 'blue',
  '#f97316': 'orange',
  '#6366f1': 'indigo',
  '#10b981': 'green',
  '#6b7280': 'gray',
  '#ef4444': 'red',
};

/**
 * Charge les statuts depuis GET /supplier-orders/statuses.
 * Retourne { map: { CODE: {...} }, list: [{code, label, color, radixColor, description, is_locked}] }
 */
export function useSupplierOrderStatuses() {
  const [statuses, setStatuses] = useState({ map: {}, list: [] });

  useEffect(() => {
    fetchSupplierOrderStatuses()
      .then((apiList) => {
        const map = {};
        const list = apiList.map((s) => {
          const enriched = { ...s, radixColor: HEX_TO_RADIX[s.color?.toLowerCase()] || 'gray' };
          map[s.code] = enriched;
          return enriched;
        });
        setStatuses({ map, list });
      })
      .catch(() => {});
  }, []);

  return statuses;
}

/**
 * Charge les facets (compteurs par statut) une seule fois pour le tab parent.
 * Utilise limit=1 car les facets sont toujours complets quel que soit le filtre.
 */
export function useSupplierOrderFacets() {
  const [facets, setFacets] = useState({});

  useEffect(() => {
    fetchSupplierOrders({ limit: 1 })
      .then(({ facets: data }) => {
        const map = {};
        data.forEach((f) => {
          map[f.status] = f.count;
        });
        setFacets(map);
      })
      .catch(() => {});
  }, []);

  return facets;
}
