/**
 * @fileoverview Handlers pour useSupplierOrdersTable
 * @module components/purchase/orders/useSupplierOrdersTable/handlers
 */

import { suppliers } from '@/lib/api/facade';
import {
  createHandleCopyHTMLEmail,
  createHandleExportCSV,
  createHandleSendEmail,
} from '../exportHandlers';
import { handleStatusChange, handleReEvaluateDA } from '../supplierOrdersHandlers';

/**
 * Crée les callbacks des handlers avec les dépendances
 */
export function createHandlers({
  getOrderLines,
  setOrderLines,
  setLocalOrders,
  expandedOrderId,
  onRefresh,
  showError,
}) {
  const handleLineUpdate = (lineId, updates) => {
    setOrderLines((prev) =>
      prev.map((line) => (line.id === lineId ? { ...line, ...updates } : line))
    );
  };

  const handleViewDetails = async (order) => {
    try {
      const lines = await getOrderLines(order.id);
      setOrderLines(lines);
      return lines;
    } catch (error) {
      showError(
        error instanceof Error ? error : new Error('Erreur lors du chargement des détails')
      );
      throw error;
    }
  };

  const handleExportCSV = (order) => createHandleExportCSV(getOrderLines, showError)(order);

  const handleSendEmail = (order) => createHandleSendEmail(getOrderLines, showError)(order);

  const handleCopyHTMLEmail = (order) => createHandleCopyHTMLEmail(getOrderLines, showError)(order);

  const wrappedHandleStatusChange = async (orderId, newStatus) => {
    await handleStatusChange(
      orderId,
      newStatus,
      onRefresh,
      expandedOrderId,
      async () => {},
      setOrderLines,
      showError
    );
    setLocalOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order))
    );
  };

  const handlePurgeOrder = async (order) => {
    try {
      await suppliers.purgeSupplierOrder(order.id);
      setLocalOrders((prev) => prev.filter((o) => o.id !== order.id));
      if (expandedOrderId === order.id) {
        setOrderLines([]);
      }
      await onRefresh?.();
    } catch (error) {
      showError(error instanceof Error ? error : new Error('Erreur lors de la purge du panier'));
      throw error;
    }
  };

  const handleReEvaluate = async (order) => {
    await handleReEvaluateDA(order, onRefresh, async () => {}, showError);
  };

  return {
    handleLineUpdate,
    handleViewDetails,
    handleExportCSV,
    handleSendEmail,
    handleCopyHTMLEmail,
    wrappedHandleStatusChange,
    handlePurgeOrder,
    handleReEvaluate,
  };
}
