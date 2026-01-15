import { useCallback } from 'react';
import { stock } from '@/lib/api/facade';
import { useOptimisticPurchaseRequests } from './useOptimisticData';

/**
 * Hook pour gérer la logique des demandes d'achat
 * Centralise: fetch, update status, link items
 * Utilise des mises à jour optimistes pour éviter les rechargements complets
 */
export const usePurchaseRequestsManagement = (onError) => {
  // Hook optimiste pour gérer les données
  const optimistic = useOptimisticPurchaseRequests(
    () => stock.fetchPurchaseRequests(),
    onError
  );

  const updateStatus = useCallback(async (requestId, newStatus) => {
    // Mise à jour optimiste locale immédiate
    optimistic.updateStatus(requestId, newStatus);
    
    try {
      // Mise à jour API en arrière-plan
      await stock.updatePurchaseRequest(requestId, { status: newStatus });
    } catch (error) {
      console.error('Erreur changement statut:', error);
      // En cas d'erreur, recharger depuis l'API pour corriger
      optimistic.invalidate();
      throw error;
    }
  }, [optimistic]);

  const linkExistingItem = useCallback(async (requestId, stockItem) => {
    // Mise à jour optimiste locale immédiate
    optimistic.linkItem(requestId, stockItem.id, stockItem.name);
    
    try {
      // Mise à jour API en arrière-plan
      await stock.updatePurchaseRequest(requestId, {
        stock_item_id: stockItem.id,
        item_label: stockItem.name,
      });
    } catch (error) {
      console.error('Erreur liaison article:', error);
      // En cas d'erreur, recharger depuis l'API
      optimistic.invalidate();
      throw error;
    }
  }, [optimistic]);

  const createAndLink = useCallback(async (requestId, itemData) => {
    try {
      const newItem = await stock.createStockItem({
        ...itemData,
        quantity: 0,
      });

      // Mise à jour optimiste locale immédiate
      optimistic.linkItem(requestId, newItem.id, newItem.name);

      await stock.updatePurchaseRequest(requestId, {
        stock_item_id: newItem.id,
        item_label: newItem.name,
      });

      return newItem;
    } catch (error) {
      console.error('Erreur création et liaison:', error);
      // En cas d'erreur, recharger depuis l'API
      optimistic.invalidate();
      throw error;
    }
  }, [optimistic]);

  const deleteRequest = useCallback(async (requestId) => {
    // Suppression optimiste locale immédiate
    optimistic.removeLocal(requestId);
    
    try {
      // Suppression API en arrière-plan
      await stock.deletePurchaseRequest(requestId);
    } catch (error) {
      console.error('Erreur suppression DA:', error);
      // En cas d'erreur, recharger depuis l'API
      optimistic.invalidate();
      throw error;
    }
  }, [optimistic]);

  return {
    // State
    requests: optimistic.requests,
    loading: optimistic.loading,
    version: optimistic.version,

    // Actions
    loadRequests: optimistic.load,
    updateStatus,
    linkExistingItem,
    createAndLink,
    deleteRequest,
    invalidate: optimistic.invalidate,
  };
};
