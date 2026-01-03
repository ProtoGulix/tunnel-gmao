import { useCallback, useState } from 'react';
import { stock, stockSuppliers, stockSpecs } from '@/lib/api/facade';

/**
 * Hook pour gérer la logique des articles en stock
 * Centralise: fetch, create, update, supplier refs
 */
export const useStockItemsManagement = (onError) => {
  const [stockItems, setStockItems] = useState([]);
  const [stockItemSuppliers, setStockItemSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [supplierRefsCounts, setSupplierRefsCounts] = useState({});
  const [specsCounts, setSpecsCounts] = useState({});
  const [specsHasDefault, setSpecsHasDefault] = useState({});
  const [supplierRefsByItem, setSupplierRefsByItem] = useState({});
  const [standardSpecsByItem, setStandardSpecsByItem] = useState({});

  const loadStockItems = useCallback(
    async (isInitial = false) => {
      try {
        if (isInitial) setLoading(true);

        const data = await stock.fetchStockItems();
        setStockItems(data);

        if (data.length > 0) {
          const zeroCounts = {};
          const zeroDefaults = {};
          data.forEach((item) => {
            zeroCounts[item.id] = 0;
            zeroDefaults[item.id] = false;
          });
          setSupplierRefsCounts(zeroCounts);
          setSpecsCounts(zeroCounts);
          setSpecsHasDefault(zeroDefaults);
        }

        return data;
      } catch (error) {
        console.error('Erreur chargement stock:', error);
        onError?.('Impossible de charger le stock');
        return [];
      } finally {
        if (isInitial) setLoading(false);
      }
    },
    [onError]
  );

  const addStockItem = useCallback(async (itemData) => {
    try {
      const newItem = await stock.createStockItem(itemData);
      setStockItems((prev) => [...prev, newItem]);
      return newItem;
    } catch (error) {
      console.error('Erreur ajout article:', error);
      throw error;
    }
  }, []);

  const updateItem = useCallback(async (itemId, itemData) => {
    try {
      const updatedItem = await stock.updateStockItem(itemId, itemData);
      setStockItems((prev) => prev.map((item) => (item.id === itemId ? updatedItem : item)));
      return updatedItem;
    } catch (error) {
      console.error('Erreur mise à jour article:', error);
      throw error;
    }
  }, []);

  const loadSupplierRefs = useCallback(async (stockItemId) => {
    try {
      const data = await stockSuppliers.fetchStockItemSuppliers(stockItemId);
      setStockItemSuppliers(data);
      setSupplierRefsByItem((prev) => ({
        ...prev,
        [stockItemId]: data,
      }));
      setSupplierRefsCounts((prev) => ({
        ...prev,
        [stockItemId]: data.length,
      }));
      return data;
    } catch (error) {
      console.error('Erreur chargement références:', error);
      throw error;
    }
  }, []);

  const loadStandardSpecs = useCallback(async (stockItemId) => {
    try {
      const specs = await stockSpecs.fetchStockSpecsForItem(stockItemId);
      setStandardSpecsByItem((prev) => ({
        ...prev,
        [stockItemId]: specs || [],
      }));
      setSpecsCounts((prev) => ({
        ...prev,
        [stockItemId]: (specs || []).length,
      }));
      setSpecsHasDefault((prev) => ({
        ...prev,
        [stockItemId]: (specs || []).some((s) => s.is_default),
      }));
      return specs;
    } catch (error) {
      console.error('Erreur chargement spécifications:', error);
      throw error;
    }
  }, []);

  const prefetchSupplierRefsForItems = useCallback(
    async (stockItemIds = []) => {
      const uniqueIds = Array.from(new Set(stockItemIds.filter(Boolean)));
      const missingIds = uniqueIds.filter((id) => !supplierRefsByItem[id]);
      if (missingIds.length === 0) return [];
      return Promise.all(missingIds.map((id) => loadSupplierRefs(id)));
    },
    [loadSupplierRefs, supplierRefsByItem]
  );

  const addSupplierRef = useCallback(
    async (stockItemId, refData) => {
      try {
        await stockSuppliers.createStockItemSupplier({
          stock_item_id: stockItemId,
          ...refData,
        });
        await loadSupplierRefs(stockItemId);
      } catch (error) {
        console.error('Erreur ajout référence:', error);
        throw error;
      }
    },
    [loadSupplierRefs]
  );

  const updateSupplierRef = useCallback(
    async (refId, updates, stockItemId) => {
      try {
        await stockSuppliers.updateStockItemSupplier(refId, updates);
        await loadSupplierRefs(stockItemId);
      } catch (error) {
        console.error('Erreur mise à jour référence:', error);
        throw error;
      }
    },
    [loadSupplierRefs]
  );

  const deleteSupplierRef = useCallback(
    async (refId, stockItemId) => {
      try {
        await stockSuppliers.deleteStockItemSupplier(refId);
        await loadSupplierRefs(stockItemId);
      } catch (error) {
        console.error('Erreur suppression référence:', error);
        throw error;
      }
    },
    [loadSupplierRefs]
  );

  return {
    // State
    stockItems,
    stockItemSuppliers,
    loading,
    supplierRefsCounts,
    specsCounts,
    specsHasDefault,
    supplierRefsByItem,
    standardSpecsByItem,

    // Methods
    loadStockItems,
    addStockItem,
    updateItem,
    loadSupplierRefs,
    loadStandardSpecs,
    prefetchSupplierRefsForItems,
    addSupplierRef,
    updateSupplierRef,
    deleteSupplierRef,
  };
};
