import { useCallback, useState } from 'react';
import { stock } from '@/lib/api/facade';

/**
 * Hook pour gérer la logique des demandes d'achat
 * Centralise: fetch, update status, link items
 */
export const usePurchaseRequestsManagement = (onError) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadRequests = useCallback(
    async (isInitial = false) => {
      try {
        if (isInitial) setLoading(true);

        const data = await stock.fetchPurchaseRequests();
        setRequests(data);
        return data;
      } catch (error) {
        console.error('Erreur chargement demandes:', error);
        onError?.("Impossible de charger les demandes d'achat");
        return [];
      } finally {
        if (isInitial) setLoading(false);
      }
    },
    [onError]
  );

  const updateStatus = useCallback(async (requestId, newStatus) => {
    try {
      await stock.updatePurchaseRequest(requestId, { status: newStatus });
      setRequests((prev) =>
        prev.map((req) => (req.id === requestId ? { ...req, status: newStatus } : req))
      );
    } catch (error) {
      console.error('Erreur changement statut:', error);
      throw error;
    }
  }, []);

  const linkExistingItem = useCallback(async (requestId, stockItem) => {
    try {
      await stock.updatePurchaseRequest(requestId, {
        stock_item_id: stockItem.id,
        item_label: stockItem.name,
      });
      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? {
                ...req,
                stock_item_id: stockItem.id,
                item_label: stockItem.name,
              }
            : req
        )
      );
    } catch (error) {
      console.error('Erreur liaison article:', error);
      throw error;
    }
  }, []);

  const createAndLink = useCallback(async (requestId, itemData) => {
    try {
      const newItem = await stock.createStockItem({
        ...itemData,
        quantity: 0,
      });

      await stock.updatePurchaseRequest(requestId, {
        stock_item_id: newItem.id,
        item_label: newItem.name,
      });

      setRequests((prev) =>
        prev.map((req) =>
          req.id === requestId
            ? {
                ...req,
                stock_item_id: newItem.id,
                item_label: newItem.name,
              }
            : req
        )
      );

      return newItem;
    } catch (error) {
      console.error('Erreur création et liaison:', error);
      throw error;
    }
  }, []);

  return {
    // State
    requests,
    loading,

    // Methods
    loadRequests,
    updateStatus,
    linkExistingItem,
    createAndLink,
  };
};
