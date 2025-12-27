import { api, invalidateCache } from '@/lib/api/client';
import { apiCall } from '@/lib/api/errors';

const DEFAULT_PURCHASE_REQUEST_STATUS = 'open';

// ============================================================================
// Response Mappers (Backend → Domain DTOs)
// ============================================================================

/**
 * Maps a Directus purchase_request response to domain PurchaseRequest DTO.
 * @param {Object} item - Backend purchase_request object
 * @returns {Object|null} Domain PurchaseRequest DTO or null
 */
const mapPurchaseRequestToDomain = (item) => {
  if (!item) return null;
  return {
    id: item.id,
    stockItemId: item.stock_item_id ?? undefined,
    itemLabel: item.item_label ?? undefined,
    quantity: item.quantity ?? undefined,
    unit: item.unit ?? undefined,
    urgency: item.urgency ?? undefined,
    requestedBy: item.requested_by ?? undefined,
    reason: item.reason ?? undefined,
    notes: item.notes ?? undefined,
    status: item.status ?? undefined,
    createdAt: item.created_at ?? undefined,
    interventionId: item.intervention_id ?? undefined,
  };
};

/**
 * Maps a Directus stock_item response to domain StockItem DTO.
 * @param {Object} item - Backend stock_item object
 * @returns {Object|null} Domain StockItem DTO or null
 */
const mapStockItemToDomain = (item) => {
  if (!item) return null;
  return {
    id: item.id,
    name: item.name ?? undefined,
    familyCode: item.family_code ?? undefined,
    subFamilyCode: item.sub_family_code ?? undefined,
    spec: item.spec ?? undefined,
    dimension: item.dimension ?? undefined,
    ref: item.ref ?? undefined,
    quantity: item.quantity ?? undefined,
    unit: item.unit ?? undefined,
    location: item.location ?? undefined,
    manufacturerItem:
      typeof item.manufacturer_item_id === 'object' && item.manufacturer_item_id?.id
        ? {
            id: item.manufacturer_item_id.id,
            manufacturerName: item.manufacturer_item_id.manufacturer_name ?? undefined,
            manufacturerRef: item.manufacturer_item_id.manufacturer_ref ?? undefined,
            designation: item.manufacturer_item_id.designation ?? undefined,
          }
        : item.manufacturer_item_id
        ? { id: item.manufacturer_item_id }
        : undefined,
  };
};

/**
 * Maps a Directus stock_item_standard_spec response to domain StockSpec DTO.
 * @param {Object} item - Backend stock_item_standard_spec object
 * @returns {Object|null} Domain StockSpec DTO or null
 */
const mapStockSpecToDomain = (item) => {
  if (!item) return null;
  return {
    id: item.id,
    stockItemId:
      typeof item.stock_item_id === 'object' ? item.stock_item_id?.id : item.stock_item_id,
    title: item.title ?? undefined,
    text: item.spec_text ?? undefined,
    isDefault: item.is_default || false,
    createdAt: item.created_at ?? undefined,
    updatedAt: item.updated_at ?? undefined,
  };
};

/**
 * Maps a Directus stock_family response to domain StockFamily DTO.
 * @param {Object} item - Backend stock_family object
 * @returns {Object|null} Domain StockFamily DTO or null
 */
const mapStockFamilyToDomain = (item) => {
  if (!item) return null;
  return {
    code: item.code,
    label: item.label ?? undefined,
  };
};

/**
 * Maps a Directus stock_sub_family response to domain StockSubFamily DTO.
 * @param {Object} item - Backend stock_sub_family object
 * @returns {Object|null} Domain StockSubFamily DTO or null
 */
const mapStockSubFamilyToDomain = (item) => {
  if (!item) return null;
  return {
    id: item.id,
    familyCode: item.family_code ?? undefined,
    code: item.code ?? undefined,
    label: item.label ?? undefined,
  };
};

// ============================================================================
// Payload Mappers (Domain → Backend)
// ============================================================================

/**
 * Maps a domain PurchaseRequest payload to Directus format.
 * @param {Object} payload - Domain payload (camelCase)
 * @returns {Object} Backend payload (snake_case)
 */
const mapPurchaseRequestDomainToBackend = (payload) => {
  const backend = {};
  if (payload.stockItemId !== undefined) backend.stock_item_id = payload.stockItemId;
  if (payload.itemLabel !== undefined) backend.item_label = payload.itemLabel;
  if (payload.quantity !== undefined) backend.quantity = payload.quantity;
  if (payload.unit !== undefined) backend.unit = payload.unit;
  if (payload.urgency !== undefined) backend.urgency = payload.urgency;
  if (payload.requestedBy !== undefined) backend.requested_by = payload.requestedBy;
  if (payload.reason !== undefined) backend.reason = payload.reason;
  if (payload.notes !== undefined) backend.notes = payload.notes;
  if (payload.status !== undefined) backend.status = payload.status;
  if (payload.interventionId !== undefined) backend.intervention_id = payload.interventionId;

  // Legacy snake_case support
  if (payload.stock_item_id !== undefined) backend.stock_item_id = payload.stock_item_id;
  if (payload.item_label !== undefined) backend.item_label = payload.item_label;
  if (payload.requested_by !== undefined) backend.requested_by = payload.requested_by;
  if (payload.intervention_id !== undefined) backend.intervention_id = payload.intervention_id;
  return backend;
};

/**
 * Maps a domain StockItem payload to Directus format.
 * @param {Object} payload - Domain payload (camelCase)
 * @returns {Object} Backend payload (snake_case)
 */
const mapStockItemDomainToBackend = (payload) => {
  const backend = {};
  if (payload.name !== undefined) backend.name = payload.name;
  if (payload.familyCode !== undefined) backend.family_code = payload.familyCode;
  if (payload.subFamilyCode !== undefined) backend.sub_family_code = payload.subFamilyCode;
  if (payload.spec !== undefined) backend.spec = payload.spec;
  if (payload.dimension !== undefined) backend.dimension = payload.dimension;
  if (payload.ref !== undefined) backend.ref = payload.ref;
  if (payload.quantity !== undefined) backend.quantity = payload.quantity;
  if (payload.unit !== undefined) backend.unit = payload.unit;
  if (payload.location !== undefined) backend.location = payload.location;
  if (payload.manufacturerItemId !== undefined)
    backend.manufacturer_item_id = payload.manufacturerItemId;

  // Legacy snake_case support
  if (payload.family_code !== undefined) backend.family_code = payload.family_code;
  if (payload.sub_family_code !== undefined) backend.sub_family_code = payload.sub_family_code;
  if (payload.manufacturer_item_id !== undefined)
    backend.manufacturer_item_id = payload.manufacturer_item_id;
  return backend;
};

/**
 * Maps a domain StockSpec payload to Directus format.
 * @param {Object} payload - Domain payload (camelCase)
 * @returns {Object} Backend payload (snake_case)
 */
const mapStockSpecDomainToBackend = (payload) => {
  const backend = {};
  if (payload.stockItemId !== undefined) backend.stock_item_id = payload.stockItemId;
  if (payload.title !== undefined) backend.title = payload.title;
  if (payload.text !== undefined) backend.spec_text = payload.text;
  if (payload.isDefault !== undefined) backend.is_default = payload.isDefault;

  // Legacy snake_case support
  if (payload.stock_item_id !== undefined) backend.stock_item_id = payload.stock_item_id;
  if (payload.spec_text !== undefined) backend.spec_text = payload.spec_text;
  if (payload.is_default !== undefined) backend.is_default = payload.is_default;
  return backend;
};

// ============================================================================
// API Methods
// ============================================================================

const fetchPurchaseRequests = async () => {
  return apiCall(async () => {
    const { data } = await api.get('/items/purchase_request', {
      params: {
        limit: -1,
        sort: '-created_at',
        fields: [
          'id',
          'stock_item_id',
          'item_label',
          'quantity',
          'unit',
          'urgency',
          'requested_by',
          'reason',
          'notes',
          'status',
          'created_at',
          'intervention_id',
        ].join(','),
        _t: Date.now(),
      },
    });
    const items = data?.data || [];
    return items.map(mapPurchaseRequestToDomain);
  }, 'FetchPurchaseRequests');
};

const fetchPurchaseRequestsByIntervention = async (interventionId) => {
  return apiCall(async () => {
    const { data } = await api.get('/items/purchase_request', {
      params: {
        filter: { intervention_id: { _eq: interventionId } },
        limit: -1,
        sort: '-created_at',
        fields: [
          'id',
          'stock_item_id',
          'item_label',
          'quantity',
          'unit',
          'urgency',
          'requested_by',
          'reason',
          'notes',
          'status',
          'created_at',
          'intervention_id',
        ].join(','),
        _t: Date.now(),
      },
    });
    const items = data?.data || [];
    return items.map(mapPurchaseRequestToDomain);
  }, 'FetchPurchaseRequestsByIntervention');
};

const createPurchaseRequest = async (requestData) => {
  return apiCall(async () => {
    const backendPayload = mapPurchaseRequestDomainToBackend(requestData);
    if (backendPayload.status === undefined) {
      backendPayload.status = DEFAULT_PURCHASE_REQUEST_STATUS;
    }

    const { data } = await api.post('/items/purchase_request', backendPayload);
    invalidateCache('purchaseRequests');
    return mapPurchaseRequestToDomain(data.data);
  }, 'CreatePurchaseRequest');
};

const updatePurchaseRequest = async (id, updates) => {
  return apiCall(async () => {
    const backendUpdates = mapPurchaseRequestDomainToBackend(updates);
    const { data } = await api.patch(`/items/purchase_request/${id}`, backendUpdates);
    invalidateCache('purchaseRequests');
    invalidateCache('stockItems');
    return mapPurchaseRequestToDomain(data.data);
  }, 'UpdatePurchaseRequest');
};

const fetchStockItems = async () => {
  return apiCall(async () => {
    const params = {
      limit: -1,
      fields: [
        'id',
        'name',
        'family_code',
        'sub_family_code',
        'spec',
        'dimension',
        'ref',
        'quantity',
        'unit',
        'location',
        'manufacturer_item_id.id',
        'manufacturer_item_id.manufacturer_name',
        'manufacturer_item_id.manufacturer_ref',
        'manufacturer_item_id.designation',
      ].join(','),
      sort: '-ref',
      _t: Date.now(),
    };

    const { data } = await api.get('/items/stock_item', { params });
    const items = data?.data || [];
    return items.map(mapStockItemToDomain);
  }, 'FetchStockItems');
};

const createStockItem = async (itemData) => {
  return apiCall(async () => {
    const backendPayload = mapStockItemDomainToBackend(itemData);
    const { data } = await api.post('/items/stock_item', backendPayload);
    invalidateCache('stockItems');
    return mapStockItemToDomain(data.data);
  }, 'CreateStockItem');
};

const updateStockItem = async (id, updates) => {
  return apiCall(async () => {
    const backendUpdates = mapStockItemDomainToBackend(updates);
    const { data } = await api.patch(`/items/stock_item/${id}`, backendUpdates);
    invalidateCache('stockItems');
    return mapStockItemToDomain(data.data);
  }, 'UpdateStockItem');
};

const deleteStockItem = async (id) => {
  return apiCall(async () => {
    await api.delete(`/items/stock_item/${id}`);
    invalidateCache('stockItems');
    return true;
  }, 'DeleteStockItem');
};

const fetchStockItemStandardSpecs = async (stockItemId) => {
  return apiCall(async () => {
    const params = {
      limit: -1,
      filter: { stock_item_id: { _eq: stockItemId } },
      fields: [
        'id',
        'stock_item_id',
        'title',
        'spec_text',
        'is_default',
        'created_at',
        'updated_at',
      ].join(','),
      sort: '-is_default,-created_at',
      _t: Date.now(),
    };

    const { data } = await api.get('/items/stock_item_standard_spec', {
      params,
    });
    const items = data?.data || [];
    return items.map(mapStockSpecToDomain);
  }, 'FetchStockItemStandardSpecs');
};

const createStockItemStandardSpec = async (specData) => {
  return apiCall(async () => {
    const backendPayload = mapStockSpecDomainToBackend(specData);
    const { data } = await api.post('/items/stock_item_standard_spec', backendPayload);
    invalidateCache('stockSpecs');
    if (backendPayload.stock_item_id) {
      invalidateCache(`stockItems:${backendPayload.stock_item_id}`);
    }
    return mapStockSpecToDomain(data.data);
  }, 'CreateStockItemStandardSpec');
};

const updateStockItemStandardSpec = async (id, updates) => {
  return apiCall(async () => {
    const backendUpdates = mapStockSpecDomainToBackend(updates);
    const { data } = await api.patch(`/items/stock_item_standard_spec/${id}`, backendUpdates);
    invalidateCache('stockSpecs');
    if (backendUpdates.stock_item_id) {
      invalidateCache(`stockItems:${backendUpdates.stock_item_id}`);
    }
    return mapStockSpecToDomain(data.data);
  }, 'UpdateStockItemStandardSpec');
};

const deleteStockItemStandardSpec = async (id) => {
  return apiCall(async () => {
    await api.delete(`/items/stock_item_standard_spec/${id}`);
    invalidateCache('stockSpecs');
    return true;
  }, 'DeleteStockItemStandardSpec');
};

const fetchStockFamilies = async () => {
  return apiCall(async () => {
    const params = {
      limit: -1,
      fields: ['code', 'label'].join(','),
      sort: 'label',
      _t: Date.now(),
    };

    const { data } = await api.get('/items/stock_family', { params });
    const items = data?.data || [];
    return items.map(mapStockFamilyToDomain);
  }, 'FetchStockFamilies');
};

const fetchStockSubFamilies = async (familyCode) => {
  return apiCall(async () => {
    const params = {
      limit: -1,
      fields: ['id', 'family_code', 'code', 'label'].join(','),
      filter: { family_code: { _eq: familyCode } },
      sort: 'label',
      _t: Date.now(),
    };

    const { data } = await api.get('/items/stock_sub_family', { params });
    const items = data?.data || [];
    return items.map(mapStockSubFamilyToDomain);
  }, 'FetchStockSubFamilies');
};

// ============================================================================
// Export adapter
// ============================================================================

export const stockAdapter = {
  fetchPurchaseRequests,
  fetchPurchaseRequestsByIntervention,
  createPurchaseRequest,
  updatePurchaseRequest,
  fetchStockItems,
  createStockItem,
  updateStockItem,
  deleteStockItem,
  fetchStockItemStandardSpecs,
  createStockItemStandardSpec,
  updateStockItemStandardSpec,
  deleteStockItemStandardSpec,
  fetchStockFamilies,
  fetchStockSubFamilies,
};
