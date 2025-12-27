import { api, invalidateCache } from '@/lib/api/client';
import { apiCall } from '@/lib/api/errors';

// ============================================================================
// Response Mapper (Backend → Domain DTO)
// ============================================================================

/**
 * Maps a Directus stock-supplier link to domain StockItemSupplierLink DTO.
 *
 * Field mappings:
 * - stock_item_id → stockItemId (ID or nested object)
 * - supplier_id → supplier (nested object)
 * - supplier_ref → supplierRef
 * - is_preferred → isPreferred
 * - unit_price → unitPrice
 * - delivery_time_days → deliveryTimeDays
 * - manufacturer_item_id → manufacturerItem (nested object)
 *
 * @param {Object} item - Raw Directus response item
 * @returns {Object|null} Domain StockItemSupplierLink DTO or null if input is null
 */
const mapStockSupplierLinkToDomain = (item) => {
  if (!item) return null;
  return {
    id: item.id,
    stockItemId:
      typeof item.stock_item_id === 'object' ? item.stock_item_id?.id : item.stock_item_id,
    supplier:
      typeof item.supplier_id === 'object'
        ? {
            id: item.supplier_id.id,
            name: item.supplier_id.name || undefined,
          }
        : item.supplier_id
        ? { id: item.supplier_id }
        : undefined,
    supplierRef: item.supplier_ref || undefined,
    isPreferred: item.is_preferred || false,
    unitPrice: item.unit_price ?? undefined,
    deliveryTimeDays: item.delivery_time_days ?? undefined,
    // Manufacturer relation (optional)
    manufacturerItem:
      typeof item.manufacturer_item_id === 'object' && item.manufacturer_item_id?.id
        ? {
            id: item.manufacturer_item_id.id,
            manufacturerName: item.manufacturer_item_id.manufacturer_name || undefined,
            manufacturerRef: item.manufacturer_item_id.manufacturer_ref || undefined,
            designation: item.manufacturer_item_id.designation || undefined,
          }
        : undefined,
    // Stock item relation (for supplier panel)
    stockItem:
      typeof item.stock_item_id === 'object' && item.stock_item_id?.id
        ? {
            id: item.stock_item_id.id,
            ref: item.stock_item_id.ref || undefined,
            name: item.stock_item_id.name || undefined,
          }
        : undefined,
  };
};

// ============================================================================
// Payload Mapper (Domain → Backend)
// ============================================================================

/**
 * Maps domain StockItemSupplierLink payload to Directus format.
 *
 * Selective field mapping (only defined fields are included).
 * Converts camelCase domain names to snake_case Directus names.
 *
 * @param {Object} payload - Domain StockItemSupplierLink payload
 * @param {string} [payload.stockItemId] - Stock item ID
 * @param {string} [payload.supplierId] - Supplier ID
 * @param {string} [payload.supplierRef] - Supplier's reference for this item
 * @param {number} [payload.unitPrice] - Unit price from this supplier
 * @param {number} [payload.deliveryTimeDays] - Delivery time in days
 * @param {string} [payload.manufacturerItemId] - Manufacturer item ID
 * @returns {Object} Directus-compatible payload
 */
const mapStockSupplierLinkDomainToBackend = (payload) => {
  const backend = {};
  if (payload.stockItemId !== undefined) backend.stock_item_id = payload.stockItemId;
  if (payload.supplierId !== undefined) backend.supplier_id = payload.supplierId;
  if (payload.supplierRef !== undefined) backend.supplier_ref = payload.supplierRef;
  if (payload.unitPrice !== undefined) backend.unit_price = payload.unitPrice ?? null;
  if (payload.deliveryTimeDays !== undefined)
    backend.delivery_time_days = payload.deliveryTimeDays ?? null;
  if (payload.isPreferred !== undefined) backend.is_preferred = payload.isPreferred ?? false;
  if (payload.manufacturerItemId !== undefined)
    backend.manufacturer_item_id = payload.manufacturerItemId;

  // Support legacy field names
  if (payload.stock_item_id !== undefined) backend.stock_item_id = payload.stock_item_id;
  if (payload.supplier_id !== undefined) backend.supplier_id = payload.supplier_id;
  if (payload.supplier_ref !== undefined) backend.supplier_ref = payload.supplier_ref;
  if (payload.unit_price !== undefined) backend.unit_price = payload.unit_price ?? null;
  if (payload.delivery_time_days !== undefined)
    backend.delivery_time_days = payload.delivery_time_days ?? null;
  if (payload.is_preferred !== undefined) backend.is_preferred = payload.is_preferred ?? false;
  if (payload.manufacturer_item_id !== undefined)
    backend.manufacturer_item_id = payload.manufacturer_item_id;

  return backend;
};

// ============================================================================
// API Methods
// ============================================================================

const fetchStockItemSuppliers = async (stockItemId) => {
  return apiCall(async () => {
    const { data } = await api.get('/items/stock_item_supplier', {
      params: {
        filter: { stock_item_id: { _eq: stockItemId } },
        fields: [
          'id',
          'stock_item_id',
          'supplier_id.id',
          'supplier_id.name',
          'supplier_ref',
          'is_preferred',
          'unit_price',
          'delivery_time_days',
          // Manufacturer relation (optional, progressive)
          'manufacturer_item_id.id',
          'manufacturer_item_id.manufacturer_name',
          'manufacturer_item_id.manufacturer_ref',
          'manufacturer_item_id.designation',
        ].join(','),
        _t: Date.now(),
      },
    });
    const items = data?.data || [];
    return items.map(mapStockSupplierLinkToDomain);
  }, 'FetchStockItemSuppliers');
};

const fetchSupplierRefsBySupplier = async (supplierId) => {
  return apiCall(async () => {
    const { data } = await api.get('/items/stock_item_supplier', {
      params: {
        filter: { supplier_id: { _eq: supplierId } },
        fields: [
          'id',
          'supplier_id',
          'stock_item_id.id',
          'stock_item_id.ref',
          'stock_item_id.name',
          'supplier_ref',
          'is_preferred',
          'unit_price',
          'delivery_time_days',
          'manufacturer_item_id.id',
          'manufacturer_item_id.manufacturer_name',
          'manufacturer_item_id.manufacturer_ref',
          'manufacturer_item_id.designation',
        ].join(','),
        sort: ['stock_item_id.ref'].join(','),
        _t: Date.now(),
      },
    });
    const items = data?.data || [];
    return items.map(mapStockSupplierLinkToDomain);
  }, 'FetchSupplierRefsBySupplier');
};

const createStockItemSupplier = async (linkData) => {
  return apiCall(async () => {
    // Normalize payload
    const backendPayload = mapStockSupplierLinkDomainToBackend(linkData);

    // Validate supplier_ref - but be lenient on empty strings
    const supplierRef = backendPayload.supplier_ref;

    if (supplierRef === undefined || supplierRef === null) {
      console.error('[API] ERROR: supplier_ref is undefined or null');
      throw new Error('supplier_ref is required');
    }

    if (typeof supplierRef !== 'string') {
      console.error("[API] ERROR: supplier_ref is not a string, it's a", typeof supplierRef);
      throw new Error(`supplier_ref must be a string, got ${typeof supplierRef}`);
    }

    const trimmedRef = supplierRef.trim();
    if (!trimmedRef) {
      console.error('[API] ERROR: supplier_ref is empty after trim:', {
        original: supplierRef,
        trimmed: trimmedRef,
      });
      throw new Error('supplier_ref cannot be empty');
    }

    // Apply trimmed ref
    backendPayload.supplier_ref = trimmedRef;

    const { data } = await api.post('/items/stock_item_supplier', backendPayload);

    invalidateCache('stockSuppliers');
    invalidateCache(`stockItems:${backendPayload.stock_item_id}`);

    return mapStockSupplierLinkToDomain(data.data);
  }, 'CreateStockItemSupplier');
};

const updateStockItemSupplier = async (id, updates) => {
  return apiCall(async () => {
    const backendUpdates = mapStockSupplierLinkDomainToBackend(updates);
    const { data } = await api.patch(`/items/stock_item_supplier/${id}`, backendUpdates);

    invalidateCache('stockSuppliers');
    if (backendUpdates.stock_item_id) {
      invalidateCache(`stockItems:${backendUpdates.stock_item_id}`);
    }

    return mapStockSupplierLinkToDomain(data.data);
  }, 'UpdateStockItemSupplier');
};

const setPreferredSupplier = async (stockItemId, linkId) => {
  return apiCall(async () => {
    // 1. Récupérer tous les liens pour cet article
    const links = await fetchStockItemSuppliers(stockItemId);

    // 2. Mettre à jour tous les liens (un seul sera preferred)
    const updates = links.map((link) => {
      const isPreferred = link.id === linkId;
      return updateStockItemSupplier(link.id, { isPreferred });
    });

    await Promise.all(updates);

    invalidateCache('stockSuppliers');
    invalidateCache(`stockItems:${stockItemId}`);

    return true;
  }, 'SetPreferredSupplier');
};

const deleteStockItemSupplier = async (id) => {
  return apiCall(async () => {
    await api.delete(`/items/stock_item_supplier/${id}`);

    invalidateCache('stockSuppliers');

    return true;
  }, 'DeleteStockItemSupplier');
};

// ============================================================================
// Export adapter
// ============================================================================

export const stockSuppliersAdapter = {
  fetchStockItemSuppliers,
  fetchSupplierRefsBySupplier,
  createStockItemSupplier,
  updateStockItemSupplier,
  setPreferredSupplier,
  deleteStockItemSupplier,
};
