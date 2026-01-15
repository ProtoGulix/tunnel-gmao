import { useCallback, useState } from 'react';
import { suppliers as suppliersApi } from '@/lib/api/facade';
import { useOptimisticData } from './useOptimisticData';

/**
 * Hook pour gérer la logique des achats (fournisseurs et paniers)
 * Centralise: fetch suppliers, supplier orders, dispatch logic
 * Utilise des mises à jour optimistes pour éviter les rechargements
 */
export const usePurchasingManagement = (onError) => {
  const [dispatching, setDispatching] = useState(false);

  // Hook optimiste pour les fournisseurs
  const suppliersOptimistic = useOptimisticData(
    () => suppliersApi.fetchSuppliers(),
    onError
  );

  // Hook optimiste pour les commandes fournisseurs
  const ordersOptimistic = useOptimisticData(
    () => suppliersApi.fetchSupplierOrders(),
    onError
  );

  /**
   * Met à jour une ligne de commande localement (optimiste)
   */
  const updateOrderLine = useCallback((orderId, lineId, lineUpdates) => {
    ordersOptimistic.setData(prev => 
      prev.map(order => {
        if (order.id !== orderId) return order;
        
        const lines = order.lines || order.orderLines || [];
        return {
          ...order,
          lines: lines.map(line => 
            line.id === lineId ? { ...line, ...lineUpdates } : line
          ),
          orderLines: lines.map(line => 
            line.id === lineId ? { ...line, ...lineUpdates } : line
          ),
        };
      })
    );
  }, [ordersOptimistic]);

  /**
   * Met à jour le statut d'une commande localement (optimiste)
   */
  const updateOrderStatus = useCallback((orderId, newStatus) => {
    ordersOptimistic.updateLocal(orderId, { status: newStatus });
  }, [ordersOptimistic]);

  const dispatch = useCallback(async () => {
    try {
      setDispatching(true);
      const results = await suppliersApi.dispatchPurchaseRequests();

      // Recharger les paniers après dispatch
      await ordersOptimistic.invalidate();

      return results;
    } catch (error) {
      console.error('Erreur dispatch:', error);
      throw error;
    } finally {
      setDispatching(false);
    }
  }, [ordersOptimistic]);

  const loadAll = useCallback(
    async (isInitial = false) => {
      return Promise.all([
        suppliersOptimistic.load(isInitial),
        ordersOptimistic.load(isInitial)
      ]);
    },
    [suppliersOptimistic, ordersOptimistic]
  );

  return {
    // State
    suppliers: suppliersOptimistic.data,
    supplierOrders: ordersOptimistic.data,
    loading: suppliersOptimistic.loading || ordersOptimistic.loading,
    dispatching,
    version: suppliersOptimistic.version + ordersOptimistic.version,

    // Methods
    loadSuppliers: suppliersOptimistic.load,
    loadSupplierOrders: ordersOptimistic.load,
    loadAll,
    dispatch,
    updateOrderLine,
    updateOrderStatus,
    invalidateSuppliers: suppliersOptimistic.invalidate,
    invalidateOrders: ordersOptimistic.invalidate,
  };
};
