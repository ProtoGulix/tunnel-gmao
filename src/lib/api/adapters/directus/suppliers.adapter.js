import { api, invalidateCache } from '@/lib/api/client';
import { apiCall } from '@/lib/api/errors';
import { stockSuppliersAdapter } from './stockSuppliers.adapter';
import { stockAdapter } from './stock.adapter';

/**
 * Normalizes raw supplier order status to domain status string.
 * @param {string|Object|any} raw - Raw status value from backend
 * @returns {string} Normalized status value in lowercase
 */
const normalizeSupplierOrderStatus = (raw) => {
  const value = raw ? (typeof raw === 'string' ? raw : raw.value ?? raw.status ?? raw) : 'open';
  return String(value).toLowerCase();
};

/**
 * Maps a Directus supplier response to domain Supplier DTO.
 * @param {Object} item - Backend supplier object
 * @param {number} [itemCount=0] - Count of items associated with supplier
 * @returns {Object|null} Domain Supplier DTO or null
 */
const mapSupplierToDomain = (item, itemCount = 0) => {
  if (!item) return null;
  return {
    id: item.id,
    name: item.name ?? undefined,
    contactName: item.contact_name ?? undefined,
    email: item.email ?? undefined,
    phone: item.phone ?? undefined,
    isActive: item.is_active ?? undefined,
    itemCount,
  };
};

/**
 * Maps a Directus supplier_order response to domain SupplierOrder DTO.
 * @param {Object} order - Backend supplier_order object
 * @param {number} [lineCount=0] - Count of order lines
 * @returns {Object|null} Domain SupplierOrder DTO or null
 */
const mapSupplierOrderToDomain = (order, lineCount = 0) => {
  if (!order) return null;
  const supplier = order.supplier_id;
  return {
    id: order.id,
    orderNumber: order.order_number ?? undefined,
    supplier: supplier
      ? {
          id: supplier.id ?? supplier,
          name: supplier.name ?? undefined,
          email: supplier.email ?? undefined,
          contactName: supplier.contact_name ?? undefined,
        }
      : undefined,
    status: normalizeSupplierOrderStatus(order.status),
    totalAmount: order.total_amount ?? undefined,
    createdAt: order.created_at ?? undefined,
    orderedAt: order.ordered_at ?? undefined,
    receivedAt: order.received_at ?? undefined,
    lineCount,
  };
};

/**
 * Maps manufacturer data from order line to domain format.
 * @param {Object|string|any} raw - Manufacturer object or ID from order line
 * @returns {Object|undefined} Domain Manufacturer DTO or undefined
 */
const mapManufacturerFromLine = (raw) => {
  if (!raw) return undefined;
  if (typeof raw === 'object' && raw.id) {
    return {
      id: raw.id,
      manufacturerName: raw.manufacturer_name ?? undefined,
      manufacturerRef: raw.manufacturer_ref ?? undefined,
      designation: raw.designation ?? undefined,
    };
  }
  return { id: raw };
};

/**
 * Maps stock item data from supplier order line to domain format.
 * @param {Object} lineStockItem - Backend stock_item object from order line
 * @returns {Object|undefined} Domain StockItem DTO or undefined
 */
const mapLineStockItemToDomain = (lineStockItem) => {
  if (!lineStockItem) return undefined;
  return {
    id: lineStockItem.id,
    ref: lineStockItem.ref ?? undefined,
    name: lineStockItem.name ?? undefined,
    familyCode: lineStockItem.family_code ?? undefined,
    subFamilyCode: lineStockItem.sub_family_code ?? undefined,
    dimension: lineStockItem.dimension ?? undefined,
    location: lineStockItem.location ?? undefined,
    unit: lineStockItem.unit ?? undefined,
    manufacturerItem: mapManufacturerFromLine(lineStockItem.manufacturer_item_id),
  };
};

/**
 * Maps purchase request junction data to domain format.
 * @param {Object} junction - Backend junction object linking order line to purchase request
 * @returns {Object|null} Domain PurchaseRequest DTO or null
 */
const mapPurchaseRequestJunctionToDomain = (junction) => {
  if (!junction) return null;
  const pr = junction.purchase_request_id;
  const qty = junction.quantity;
  return {
    id: (typeof pr === 'object' ? pr?.id : pr) ?? junction.id,
    requestedBy: pr?.requested_by ?? undefined,
    itemLabel: pr?.item_label ?? undefined,
    intervention: pr?.intervention_id
      ? {
          id: pr.intervention_id.id ?? pr.intervention_id,
          code: pr.intervention_id.code ?? undefined,
        }
      : undefined,
    quantity: qty !== undefined && qty !== null ? Number(qty) : undefined,
  };
};

/**
 * Maps a domain Supplier payload to Directus format.
 * @param {Object} payload - Domain Supplier payload (camelCase)
 * @returns {Object} Backend payload (snake_case)
 */
const mapSupplierPayloadToBackend = (payload) => {
  const backend = {};
  if (payload.name !== undefined) backend.name = payload.name;
  if (payload.contactName !== undefined) backend.contact_name = payload.contactName;
  if (payload.email !== undefined) backend.email = payload.email;
  if (payload.phone !== undefined) backend.phone = payload.phone;
  if (payload.isActive !== undefined) backend.is_active = payload.isActive;
  return backend;
};

/**
 * Maps a domain SupplierOrder update payload to Directus format.
 * @param {Object} payload - Domain SupplierOrder update payload (camelCase)
 * @returns {Object} Backend payload (snake_case)
 */
const mapSupplierOrderUpdatesToBackend = (payload) => {
  const backend = {};
  if (payload.status !== undefined) backend.status = String(payload.status).toUpperCase();
  if (payload.totalAmount !== undefined) backend.total_amount = payload.totalAmount;
  if (payload.orderedAt !== undefined) backend.ordered_at = payload.orderedAt;
  if (payload.receivedAt !== undefined) backend.received_at = payload.receivedAt;
  return backend;
};

const fetchSuppliers = async () => {
  return apiCall(async () => {
    const { data } = await api.get('/items/supplier', {
      params: {
        limit: -1,
        sort: 'name',
        fields: ['id', 'name', 'contact_name', 'email', 'phone', 'is_active'].join(','),
        _t: Date.now(),
      },
    });

    const suppliers = data?.data || [];

    return Promise.all(
      suppliers.map(async (supplier) => {
        let itemCount = 0;
        try {
          const { data: countData } = await api.get('/items/stock_item_supplier', {
            params: {
              filter: { supplier_id: { _eq: supplier.id } },
              aggregate: { count: 'id' },
              _t: Date.now(),
            },
          });
          itemCount = Number(countData?.data?.[0]?.count?.id || 0);
        } catch {
          itemCount = 0;
        }
        return mapSupplierToDomain(supplier, itemCount);
      })
    );
  }, 'FetchSuppliers');
};

const createSupplier = async (supplierData) => {
  return apiCall(async () => {
    const backendPayload = mapSupplierPayloadToBackend(supplierData);
    const { data } = await api.post('/items/supplier', backendPayload);
    invalidateCache('suppliers');
    return mapSupplierToDomain(data?.data, 0);
  }, 'CreateSupplier');
};

const updateSupplier = async (id, updates) => {
  return apiCall(async () => {
    const backendUpdates = mapSupplierPayloadToBackend(updates);
    const { data } = await api.patch(`/items/supplier/${id}`, backendUpdates);
    invalidateCache('suppliers');
    return mapSupplierToDomain(data?.data, updates?.itemCount ?? updates?.item_count ?? 0);
  }, 'UpdateSupplier');
};

const deleteSupplier = async (id) => {
  return apiCall(async () => {
    await api.delete(`/items/supplier/${id}`);
    invalidateCache('suppliers');
    return true;
  }, 'DeleteSupplier');
};

const fetchSupplierOrders = async (status = null) => {
  return apiCall(async () => {
    const params = {
      limit: -1,
      sort: '-created_at',
      fields: [
        'id',
        'order_number',
        'supplier_id.id',
        'supplier_id.name',
        'supplier_id.email',
        'supplier_id.contact_name',
        'status',
        'total_amount',
        'created_at',
        'ordered_at',
        'received_at',
      ].join(','),
      _t: Date.now(),
    };

    if (status) {
      params.filter = { status: { _eq: String(status).toUpperCase() } };
    }

    const { data } = await api.get('/items/supplier_order', { params });
    const orders = data?.data || [];

    return Promise.all(
      orders.map(async (order) => {
        let lineCount = 0;
        try {
          const { data: linesData } = await api.get('/items/supplier_order_line', {
            params: {
              filter: { supplier_order_id: { _eq: order.id } },
              aggregate: { count: 'id' },
              _t: Date.now(),
            },
          });
          lineCount = Number(linesData?.data?.[0]?.count?.id || 0);
        } catch {
          lineCount = 0;
        }
        return mapSupplierOrderToDomain(order, lineCount);
      })
    );
  }, 'FetchSupplierOrders');
};

const fetchSupplierOrder = async (id) => {
  return apiCall(async () => {
    const { data } = await api.get(`/items/supplier_order/${id}`, {
      params: {
        fields: ['*', 'supplier_id.id', 'supplier_id.name', 'supplier_id.email'].join(','),
        _t: Date.now(),
      },
    });
    return mapSupplierOrderToDomain(data?.data);
  }, 'FetchSupplierOrder');
};

const fetchSupplierOrderLines = async (supplierOrderId) => {
  return apiCall(async () => {
    const { data } = await api.get('/items/supplier_order_line', {
      params: {
        filter: { supplier_order_id: { _eq: supplierOrderId } },
        fields: [
          'id',
          'supplier_order_id',
          'stock_item_id.id',
          'stock_item_id.ref',
          'stock_item_id.name',
          'stock_item_id.family_code',
          'stock_item_id.sub_family_code',
          'stock_item_id.dimension',
          'stock_item_id.location',
          'stock_item_id.unit',
          'stock_item_id.manufacturer_item_id.id',
          'stock_item_id.manufacturer_item_id.manufacturer_ref',
          'stock_item_id.manufacturer_item_id.manufacturer_name',
          'stock_item_id.manufacturer_item_id.designation',
          'supplier_ref_snapshot',
          'quantity',
          'unit_price',
          'total_price',
          'created_at',
        ].join(','),
        deep: {
          stock_item_id: {
            manufacturer_item_id: {
              _filter: {},
            },
          },
        },
        sort: 'created_at',
        _t: Date.now(),
      },
    });

    const lines = data?.data || [];

    let stockItemsMap = {};
    try {
      const stockItems = await stockAdapter.fetchStockItems();
      stockItemsMap = (stockItems || []).reduce((acc, item) => {
        acc[item.id] = item;
        return acc;
      }, {});
    } catch {
      stockItemsMap = {};
    }

    return Promise.all(
      lines.map(async (line) => {
        const stockItemId = line.stock_item_id?.id ?? line.stock_item_id;

        let purchaseRequests = [];
        try {
          const { data: junctionData } = await api.get(
            '/items/supplier_order_line_purchase_request',
            {
              params: {
                filter: { supplier_order_line_id: { _eq: line.id } },
                fields: [
                  'id',
                  'purchase_request_id',
                  'purchase_request_id.requested_by',
                  'purchase_request_id.item_label',
                  'purchase_request_id.intervention_id.id',
                  'purchase_request_id.intervention_id.code',
                  'quantity',
                ].join(','),
                _t: Date.now(),
              },
            }
          );
          purchaseRequests = (junctionData?.data || []).map(mapPurchaseRequestJunctionToDomain);
        } catch {
          purchaseRequests = [];
        }

        let standardSpecs = [];
        try {
          if (stockItemId) {
            standardSpecs = await stockAdapter.fetchStockItemStandardSpecs(stockItemId);
          }
        } catch {
          standardSpecs = [];
        }

        const stockItemFromLine = mapLineStockItemToDomain(line.stock_item_id);
        const mergedStockItem = {
          ...(stockItemsMap[stockItemId] || {}),
          ...(stockItemFromLine || {}),
          standardSpecs,
        };

        return {
          id: line.id,
          supplierOrderId: line.supplier_order_id ?? supplierOrderId,
          stockItem: mergedStockItem,
          supplierRefSnapshot: line.supplier_ref_snapshot ?? undefined,
          quantity:
            line.quantity !== undefined && line.quantity !== null
              ? Number(line.quantity)
              : undefined,
          unitPrice:
            line.unit_price !== undefined && line.unit_price !== null
              ? Number(line.unit_price)
              : undefined,
          totalPrice:
            line.total_price !== undefined && line.total_price !== null
              ? Number(line.total_price)
              : undefined,
          createdAt: line.created_at ?? undefined,
          purchaseRequests,
        };
      })
    );
  }, 'FetchSupplierOrderLines');
};

const updateSupplierOrder = async (id, updates) => {
  return apiCall(async () => {
    const backendUpdates = mapSupplierOrderUpdatesToBackend(updates);
    const { data } = await api.patch(`/items/supplier_order/${id}`, backendUpdates);
    invalidateCache('supplierOrders');
    return mapSupplierOrderToDomain(data?.data);
  }, 'UpdateSupplierOrder');
};

const dispatchPurchaseRequests = async () => {
  return apiCall(async () => {
    const { data: requestsData } = await api.get('/items/purchase_request', {
      params: {
        filter: {
          _and: [{ status: { _eq: 'open' } }, { stock_item_id: { _nnull: true } }],
        },
        fields: ['id', 'stock_item_id', 'quantity', 'item_label'].join(','),
        _t: Date.now(),
      },
    });

    const requests = requestsData?.data || [];

    const results = {
      dispatched: [],
      toQualify: [],
      errors: [],
    };

    const enrichedRequests = [];
    for (const request of requests) {
      const supplierLinks = await stockSuppliersAdapter.fetchStockItemSuppliers(
        request.stock_item_id
      );
      const preferredLink = supplierLinks.find((link) => link.isPreferred);

      if (!preferredLink) {
        results.toQualify.push(request.id);
        continue;
      }

      enrichedRequests.push({
        ...request,
        supplier_id: preferredLink.supplier?.id,
        supplier_ref: preferredLink.supplierRef,
      });
    }

    const grouped = enrichedRequests.reduce((acc, request) => {
      const key = `${request.supplier_id}::${request.stock_item_id}`;
      if (!acc[key]) {
        acc[key] = {
          supplier_id: request.supplier_id,
          stock_item_id: request.stock_item_id,
          supplier_ref: request.supplier_ref,
          requests: [],
          total_quantity: 0,
        };
      }
      acc[key].requests.push(request);
      acc[key].total_quantity += request.quantity;
      return acc;
    }, {});

    for (const group of Object.values(grouped)) {
      try {
        const { data: ordersData } = await api.get('/items/supplier_order', {
          params: {
            filter: {
              supplier_id: { _eq: group.supplier_id },
              status: { _eq: 'OPEN' },
            },
            limit: 1,
            _t: Date.now(),
          },
        });

        let supplierOrder;
        if (ordersData?.data && ordersData.data.length > 0) {
          supplierOrder = ordersData.data[0];
        } else {
          const { data: newOrderData } = await api.post('/items/supplier_order', {
            supplier_id: group.supplier_id,
            status: 'OPEN',
            order_number: '',
          });
          supplierOrder = newOrderData?.data;
        }

        const { data: existingLines } = await api.get('/items/supplier_order_line', {
          params: {
            filter: {
              supplier_order_id: { _eq: supplierOrder.id },
              stock_item_id: { _eq: group.stock_item_id },
            },
            limit: 1,
            _t: Date.now(),
          },
        });

        let lineId;

        if (existingLines?.data && existingLines.data.length > 0) {
          const existingLine = existingLines.data[0];
          const newQuantity = (existingLine.quantity || 0) + group.total_quantity;
          await api.patch(`/items/supplier_order_line/${existingLine.id}`, {
            quantity: newQuantity,
          });
          lineId = existingLine.id;
        } else {
          const linePayload = {
            supplier_order_id: supplierOrder.id,
            stock_item_id: group.stock_item_id,
            supplier_ref_snapshot: group.supplier_ref,
            quantity: group.total_quantity,
          };

          const { data: lineData } = await api.post('/items/supplier_order_line', linePayload);
          lineId = lineData?.data?.id;
        }

        for (const request of group.requests) {
          await api.post('/items/supplier_order_line_purchase_request', {
            supplier_order_line_id: lineId,
            purchase_request_id: request.id,
            quantity: request.quantity,
          });
          await stockAdapter.updatePurchaseRequest(request.id, { status: 'in_progress' });
          results.dispatched.push(request.id);
        }
      } catch (error) {
        for (const request of group.requests) {
          results.errors.push({ id: request.id, error: error.message });
        }
      }
    }

    invalidateCache('purchaseRequests');
    invalidateCache('supplierOrders');
    invalidateCache('supplierOrderLines');

    return results;
  }, 'DispatchPurchaseRequests');
};

export const suppliersAdapter = {
  fetchSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  fetchSupplierOrders,
  fetchSupplierOrder,
  fetchSupplierOrderLines,
  updateSupplierOrder,
  dispatchPurchaseRequests,
};
