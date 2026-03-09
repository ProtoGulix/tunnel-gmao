/**
 * Hook gérant le chargement et les actions du détail d'un panier fournisseur.
 * Après un PATCH de ligne, le backend renvoie la ligne mise à jour — on l'applique
 * localement sans recharger tout le détail.
 * @module hooks/purchase/useSupplierOrderDetail
 */

import { useCallback, useEffect, useState } from 'react';
import { fetchSupplierOrderDetail, fetchSupplierOrderTransitions, updateSupplierOrder } from '@/api/supplierOrders';
import { useNegotiationLines, useDeliveryDate } from '@/hooks/purchase/useNegotiationLines';

export function useSupplierOrderDetail(orderId, onStatusChange) {
  const [detail, setDetail] = useState(null);
  const [transitions, setTransitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState(null);

  const { lineDrafts, savingLines, lineErrors, initDrafts, changeDraft, saveLine } = useNegotiationLines();
  const { deliveryDate, setDeliveryDate, saving: savingDelivery, save: saveDelivery } = useDeliveryDate();

  const reloadDetail = useCallback(async (id) => {
    const [data, transData] = await Promise.all([
      fetchSupplierOrderDetail(id),
      fetchSupplierOrderTransitions(id),
    ]);
    setDetail(data);
    setTransitions(transData.transitions || []);
    initDrafts(data.lines || []);
    return data;
  }, [initDrafts]);

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    reloadDetail(orderId)
      .then((data) => setDeliveryDate(data.expected_delivery_date ? data.expected_delivery_date.slice(0, 10) : ''))
      .catch(() => setDetail(null))
      .finally(() => setLoading(false));
  }, [orderId, reloadDetail, setDeliveryDate]);

  const handleStatusChange = useCallback(async (newStatus) => {
    setStatusUpdating(true);
    setStatusError(null);
    try {
      await updateSupplierOrder(detail.id, { status: newStatus });
      await reloadDetail(detail.id);
      onStatusChange?.();
    } catch (err) {
      setStatusError(err?.response?.data?.detail || 'Transition refusée par le serveur');
    } finally {
      setStatusUpdating(false);
    }
  }, [detail, reloadDetail, onStatusChange]);

  const handleLineSave = useCallback((lineId) => {
    saveLine(lineId, (id, updated) => {
      setDetail((prev) => ({
        ...prev,
        lines: prev.lines.map((l) => (l.id === id ? { ...l, ...updated } : l)),
      }));
    });
  }, [saveLine]);

  const handleDeliverySave = useCallback(() => {
    saveDelivery(detail.id, (updated) => {
      setDetail((prev) => ({ ...prev, expected_delivery_date: updated.expected_delivery_date }));
      onStatusChange?.();
    });
  }, [saveDelivery, detail, onStatusChange]);

  return {
    detail,
    transitions,
    loading,
    statusUpdating,
    statusError,
    lineDrafts,
    savingLines,
    lineErrors,
    deliveryDate,
    setDeliveryDate,
    savingDelivery,
    changeDraft,
    handleStatusChange,
    handleLineSave,
    handleDeliverySave,
  };
}
