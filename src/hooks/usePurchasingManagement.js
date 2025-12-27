import { useCallback, useState } from 'react';
import { suppliers as suppliersApi } from '@/lib/api/facade';

/**
 * Hook pour gérer la logique des achats (fournisseurs et paniers)
 * Centralise: fetch suppliers, supplier orders, dispatch logic
 */
export const usePurchasingManagement = (onError) => {
  const [suppliers, setSuppliers] = useState([]);
  const [supplierOrders, setSupplierOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dispatching, setDispatching] = useState(false);

  const loadSuppliers = useCallback(
    async (isInitial = false) => {
      try {
        if (isInitial) setLoading(true);

        const data = await suppliersApi.fetchSuppliers();
        setSuppliers(data);
        return data;
      } catch (error) {
        console.error('Erreur chargement fournisseurs:', error);
        onError?.('Impossible de charger les fournisseurs');
        return [];
      } finally {
        if (isInitial) setLoading(false);
      }
    },
    [onError]
  );

  const loadSupplierOrders = useCallback(
    async (isInitial = false) => {
      try {
        if (isInitial) setLoading(true);

        const data = await suppliersApi.fetchSupplierOrders();
        setSupplierOrders(data);
        return data;
      } catch (error) {
        console.error('Erreur chargement paniers:', error);
        onError?.('Impossible de charger les paniers');
        return [];
      } finally {
        if (isInitial) setLoading(false);
      }
    },
    [onError]
  );

  const dispatch = useCallback(async () => {
    try {
      setDispatching(true);
      const results = await suppliersApi.dispatchPurchaseRequests();

      // Recharger les paniers après dispatch
      await loadSupplierOrders(false);

      return results;
    } catch (error) {
      console.error('Erreur dispatch:', error);
      throw error;
    } finally {
      setDispatching(false);
    }
  }, [loadSupplierOrders]);

  const loadAll = useCallback(
    async (isInitial = false) => {
      return Promise.all([loadSuppliers(isInitial), loadSupplierOrders(isInitial)]);
    },
    [loadSuppliers, loadSupplierOrders]
  );

  return {
    // State
    suppliers,
    supplierOrders,
    loading,
    dispatching,

    // Methods
    loadSuppliers,
    loadSupplierOrders,
    loadAll,
    dispatch,
  };
};
