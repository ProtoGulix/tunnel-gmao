import { useCallback, useState } from 'react';
import { stock, purchaseRequests } from '@/lib/api/facade';
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
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Hook optimiste pour gérer les données
  const optimistic = useOptimisticPurchaseRequests(
    () =>
      interventionId
        ? purchaseRequests.fetchPurchaseRequestsByIntervention(interventionId)
        : purchaseRequests.fetchPurchaseRequests(),
    onError
  );

  const linkExistingItem = useCallback(
    async (requestId, stockItem) => {
      // Mise à jour optimiste locale immédiate
      optimistic.linkItem(requestId, stockItem.id, stockItem.name);

      try {
        // Mise à jour API en arrière-plan
        await purchaseRequests.updatePurchaseRequest(requestId, {
          stockItemId: stockItem.id,
          itemLabel: stockItem.name,
        });
      } catch (error) {
        console.error('Erreur liaison article:', error);
        // En cas d'erreur, recharger depuis l'API
        optimistic.invalidate();
        throw error;
      }
    },
    [optimistic]
  );

  const createAndLink = useCallback(
    async (requestId, itemData) => {
      try {
        const newItem = await stock.createStockItem({
          ...itemData,
          quantity: 0,
        });

        // Mise à jour optimiste locale immédiate
        optimistic.linkItem(requestId, newItem.id, newItem.name);

        await purchaseRequests.updatePurchaseRequest(requestId, {
          stockItemId: newItem.id,
          itemLabel: newItem.name,
        });

        return newItem;
      } catch (error) {
        console.error('Erreur création et liaison:', error);
        // En cas d'erreur, recharger depuis l'API
        optimistic.invalidate();
        throw error;
      }
    },
    [optimistic]
  );

  const deleteRequest = useCallback(
    async (requestId) => {
      // Suppression optimiste locale immédiate
      optimistic.removeLocal(requestId);

      try {
        // Suppression API en arrière-plan
        await purchaseRequests.deletePurchaseRequest(requestId);
      } catch (error) {
        console.error('Erreur suppression DA:', error);
        // En cas d'erreur, recharger depuis l'API
        optimistic.invalidate();
        throw error;
      }
    },
    [optimistic]
  );

  const fetchStats = useCallback(
    async (params) => {
      try {
        setStatsLoading(true);
        const result = await purchaseRequests.fetchPurchaseRequestStats(params);
        setStats(result);
        return result;
      } catch (error) {
        console.error('Erreur chargement stats DA:', error);
        if (onError) onError(error);
        throw error;
      } finally {
        setStatsLoading(false);
      }
    },
    [onError]
  );

  return {
    // State
    requests: optimistic.requests,
    loading: optimistic.loading,
    version: optimistic.version,
    stats,
    statsLoading,

    // Actions
    loadRequests: optimistic.load,
    linkExistingItem,
    createAndLink,
    deleteRequest,
    fetchStats,
    invalidate: optimistic.invalidate,
  };
};
