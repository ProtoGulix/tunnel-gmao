import { useCallback } from 'react';
import { stock } from '@/lib/api/facade';
import { useOptimisticPurchaseRequests } from './useOptimisticData';

/**
 * Hook pour gérer la logique des demandes d'achat
 * Centralise: fetch, link items, delete
 * Utilise des mises à jour optimistes pour éviter les rechargements complets
 * 
 * @param {Function} onError - Callback en cas d'erreur
 * @param {string} interventionId - (Optionnel) Filtre par intervention pour charger uniquement les demandes liées
 * 
 * Note: Le statut est maintenant dérivé depuis supplier_order, plus de updateStatus
 */
export const usePurchaseRequestsManagement = (onError, interventionId = null) => {
  // Hook optimiste pour gérer les données
  const optimistic = useOptimisticPurchaseRequests(
    () => interventionId 
      ? stock.fetchPurchaseRequestsByIntervention(interventionId)
      : stock.fetchPurchaseRequests(),
    onError
  );

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
    linkExistingItem,
    createAndLink,
    deleteRequest,
    invalidate: optimistic.invalidate,
  };
};
