/**
 * @fileoverview Hook principal useSupplierOrdersTable
 * @module components/purchase/orders/useSupplierOrdersTable
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { suppliers } from '@/lib/api/facade';
import { buildColumns, buildHeaderProps } from '../supplierOrdersTableUI';
import { createRowRenderer } from '../SupplierOrdersTableRowRenderer';
import { useSortingAndCache } from './sorting';
import { createHandlers } from './handlers';

/**
 * Hook pour gérer tous les aspects du tableau des paniers
 */
export function useSupplierOrdersTable(options) {
  const {
    orders,
    onRefresh,
    showHeader = false,
    searchTerm = '',
    onSearchChange = () => {},
    statusFilter,
    onStatusFilterChange = () => {},
    supplierFilter,
    onSupplierFilterChange = () => {},
    supplierOptions = [],
    onToggleItemSelection = () => {},
    twinValidationsByLine = {},
    onTwinValidationUpdate = () => {},
    showError,
  } = options;

  const [localOrders, setLocalOrders] = useState(orders);
  const [orderLines, setOrderLines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  const { sortKey, sortDir, toggleSort, sortedOrders, getOrderLines } =
    useSortingAndCache(localOrders);

  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  // Créer les handlers avec les dépendances
  const handlers = useMemo(
    () =>
      createHandlers({
        getOrderLines: (orderId) =>
          getOrderLines(orderId, () => suppliers.fetchSupplierOrderLines(orderId)),
        setOrderLines,
        setLocalOrders,
        expandedOrderId,
        onRefresh,
        showError,
      }),
    [expandedOrderId, getOrderLines, onRefresh, showError]
  );

  // Wrapper handleViewDetails pour gérer l'état d'expansion
  const handleViewDetails = useCallback(
    async (order) => {
      try {
        setLoading(true);
        await handlers.handleViewDetails(order);
        setExpandedOrderId((prev) => (prev === order.id ? null : order.id));
      } finally {
        setLoading(false);
      }
    },
    [handlers]
  );

  const headerProps = useMemo(
    () =>
      buildHeaderProps({
        showHeader,
        ordersLength: orders.length,
        searchTerm,
        onSearchChange,
        onRefresh,
        statusFilter,
        onStatusFilterChange,
        supplierFilter,
        onSupplierFilterChange,
        supplierOptions,
      }),
    [
      onRefresh,
      onSearchChange,
      orders.length,
      searchTerm,
      showHeader,
      statusFilter,
      onStatusFilterChange,
      supplierFilter,
      onSupplierFilterChange,
      supplierOptions,
    ]
  );

  const columns = useMemo(
    () => buildColumns(sortKey, sortDir, toggleSort),
    [sortDir, sortKey, toggleSort]
  );

  const rowRenderer = useMemo(
    () =>
      createRowRenderer({
        expandedOrderId,
        cachedLines: new Map(),
        handleViewDetails,
        wrappedHandleStatusChange: handlers.wrappedHandleStatusChange,
        handleExportCSV: handlers.handleExportCSV,
        handleSendEmail: handlers.handleSendEmail,
        handleCopyHTMLEmail: handlers.handleCopyHTMLEmail,
        handlePurgeOrder: handlers.handlePurgeOrder,
        handleReEvaluate: handlers.handleReEvaluate,
        columnsLength: columns.length,
        orderLines,
        loading,
        onRefresh,
        handleLineUpdate: handlers.handleLineUpdate,
        onToggleItemSelection,
        twinValidationsByLine,
        onTwinValidationUpdate,
      }),
    [
      columns.length,
      expandedOrderId,
      handleViewDetails,
      handlers,
      loading,
      onRefresh,
      onToggleItemSelection,
      orderLines,
      twinValidationsByLine,
      onTwinValidationUpdate,
    ]
  );

  return {
    headerProps,
    columns,
    sortedOrders,
    rowRenderer,
    loading,
  };
}
