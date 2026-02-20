import { useCallback, useState } from 'react';
import { stock, stockSuppliers, stockSpecs } from '@/lib/api/facade';

const normalizeId = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value.id ?? null;
  return value;
};

/**
 * Hook pour gérer la logique des articles en stock
 * Centralise: fetch, create, update, supplier refs
 */
export const useStockItemsManagement = (onError) => {
  const [stockItems, setStockItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [stockItemSuppliers, setStockItemSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [supplierRefsCounts, setSupplierRefsCounts] = useState({});
  const [specsCounts, setSpecsCounts] = useState({});
  const [specsHasDefault, setSpecsHasDefault] = useState({});
  const [supplierRefsByItem, setSupplierRefsByItem] = useState({});
  const [standardSpecsByItem, setStandardSpecsByItem] = useState({});

  const loadStockItems = useCallback(
    async (isInitial = false, params = {}) => {
      try {
        if (isInitial) setLoading(true);

        const response = await stock.fetchStockItems(params);
        const data = response.items || response; // Support both formats
        const paginationData = response.pagination || null;

        setStockItems(data);
        setPagination(paginationData);

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

        return { items: data, pagination: paginationData };
      } catch (error) {
        console.error('Erreur chargement stock:', error);
        onError?.('Impossible de charger le stock');
        return { items: [], pagination: null };
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
      const normalizedId = normalizeId(stockItemId);
      if (!normalizedId) return [];

      const data = await stockSuppliers.fetchStockItemSuppliers(normalizedId);
      setStockItemSuppliers(data);
      setSupplierRefsByItem((prev) => ({
        ...prev,
        [normalizedId]: data,
      }));
      setSupplierRefsCounts((prev) => ({
        ...prev,
        [normalizedId]: data.length,
      }));
      return data;
    } catch (error) {
      console.error('Erreur chargement références:', error);
      throw error;
    }
  }, []);

  const loadStandardSpecs = useCallback(async (stockItemId) => {
    try {
      const normalizedId = normalizeId(stockItemId);
      if (!normalizedId) return [];

      const specs = await stockSpecs.fetchStockSpecsForItem(normalizedId);
      setStandardSpecsByItem((prev) => ({
        ...prev,
        [normalizedId]: specs || [],
      }));
      setSpecsCounts((prev) => ({
        ...prev,
        [normalizedId]: (specs || []).length,
      }));
      setSpecsHasDefault((prev) => ({
        ...prev,
        [normalizedId]: (specs || []).some((s) => s.is_default),
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
        const supplierId = normalizeId(refData.supplier_id);
        let existing = supplierRefsByItem[stockItemId];
        if (!existing) {
          existing = await loadSupplierRefs(stockItemId);
        }

        const isDuplicate = (existing || []).some((ref) => {
          const refSupplierId = normalizeId(ref.supplier_id ?? ref.supplier);
          return String(refSupplierId) === String(supplierId);
        });

        if (isDuplicate) {
          const err = new Error('Ce fournisseur est déjà associé à cet article.');
          err.code = 'DUPLICATE_SUPPLIER_REF';
          throw err;
        }

        const payload = {
          stock_item_id: stockItemId,
          ...refData,
        };
        console.log("Payload envoyé à l'API:", payload);

        await stockSuppliers.createStockItemSupplier(payload);
        await loadSupplierRefs(stockItemId);
      } catch (error) {
        console.error('Erreur ajout référence:', error);
        throw error;
      }
    },
    [loadSupplierRefs, supplierRefsByItem]
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
    pagination,
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
