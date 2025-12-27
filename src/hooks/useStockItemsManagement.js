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

        // Charger les compteurs (références + specs) pour chaque article
        if (isInitial && data.length > 0) {
          const refsCounts = {};
          const specCounts = {};
          const specDefaults = {};
          const refsByItem = {};
          const specsByItem = {};

          for (const item of data) {
            try {
              const [refs, specs] = await Promise.all([
                stockSuppliers.fetchStockItemSuppliers(item.id),
                stockSpecs.fetchStockItemStandardSpecs(item.id),
              ]);
              refsCounts[item.id] = refs.length;
              specCounts[item.id] = (specs || []).length;
              specDefaults[item.id] = (specs || []).some((s) => s.is_default);
              refsByItem[item.id] = refs || [];
              specsByItem[item.id] = specs || [];
            } catch (err) {
              console.warn(`Erreur chargement compteurs pour ${item.id}:`, err);
              refsCounts[item.id] = refsCounts[item.id] ?? 0;
              specCounts[item.id] = specCounts[item.id] ?? 0;
              specDefaults[item.id] = specDefaults[item.id] ?? false;
              refsByItem[item.id] = [];
              specsByItem[item.id] = [];
            }
          }

          setSupplierRefsCounts(refsCounts);
          setSpecsCounts(specCounts);
          setSpecsHasDefault(specDefaults);
          setSupplierRefsByItem(refsByItem);
          setStandardSpecsByItem(specsByItem);
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
    addSupplierRef,
    updateSupplierRef,
    deleteSupplierRef,
  };
};
