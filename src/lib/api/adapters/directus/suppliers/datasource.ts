// Directus datasource for suppliers domain
import { api, invalidateCache } from '@/lib/api/client';
import { apiCall } from '@/lib/api/errors';

interface ApiParams {
  limit?: number;
  sort?: string;
  fields?: string;
  filter?: Record<string, unknown>;
  aggregate?: Record<string, string>;
  _t?: number;
}

export const fetchSuppliers = async () => {
  return apiCall(async () => {
    const { data } = await api.get('/items/supplier', {
      params: {
        limit: -1,
        sort: 'name',
        fields: ['id', 'name', 'contact_name', 'email', 'phone', 'is_active'].join(','),
        _t: Date.now(),
      },
    });
    return data?.data || [];
  }, 'FetchSuppliers');
};

export const createSupplier = async (supplierData: Record<string, unknown>) => {
  return apiCall(async () => {
    const { data } = await api.post('/items/supplier', supplierData);
    invalidateCache('suppliers');
    return data?.data;
  }, 'CreateSupplier');
};

export const updateSupplier = async (id: string, updates: Record<string, unknown>) => {
  return apiCall(async () => {
    const { data } = await api.patch(`/items/supplier/${id}`, updates);
    invalidateCache('suppliers');
    return data?.data;
  }, 'UpdateSupplier');
};

export const deleteSupplier = async (id: string) => {
  return apiCall(async () => {
    await api.delete(`/items/supplier/${id}`);
    invalidateCache('suppliers');
    return true;
  }, 'DeleteSupplier');
};

export const fetchSupplierOrders = async (status: string | null = null) => {
  return apiCall(async () => {
    const params: ApiParams = {
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
    return data?.data || [];
  }, 'FetchSupplierOrders');
};

export const fetchSupplierOrder = async (id: string) => {
  return apiCall(async () => {
    const { data } = await api.get(`/items/supplier_order/${id}`, {
      params: {
        fields: ['*', 'supplier_id.id', 'supplier_id.name', 'supplier_id.email'].join(','),
        _t: Date.now(),
      },
    });
    return data?.data;
  }, 'FetchSupplierOrder');
};

export const fetchSupplierOrderLines = async (supplierOrderId: string) => {
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
        sort: 'created_at',
        _t: Date.now(),
      },
    });
    return data?.data || [];
  }, 'FetchSupplierOrderLines');
};

export const updateSupplierOrder = async (id: string, updates: Record<string, unknown>) => {
  return apiCall(async () => {
    const { data } = await api.patch(`/items/supplier_order/${id}`, updates);
    invalidateCache('supplierOrders');
    return data?.data;
  }, 'UpdateSupplierOrder');
};

export const dispatchPurchaseRequests = async () => {
  return apiCall(async () => {
    // Call custom Directus extension endpoint that executes the PostgreSQL function
    // For now, fallback to direct implementation if extension not available
    // TODO: Create Directus extension endpoint POST /extensions/dispatch
    
    // 1. Fetch all non-archived purchase requests with stock items
    const { data: reqData } = await api.get('/items/purchase_request', {
      params: {
        limit: -1,
        fields: ['id', 'stock_item_id', 'quantity', 'status', 'created_at'].join(','),
        _t: Date.now(),
      },
    });
    const purchaseRequests = reqData?.data || [];

    // 2. Fetch supplier orders (to find or use existing baskets)
    const { data: ordersData } = await api.get('/items/supplier_order', {
      params: {
        limit: -1,
        sort: '-created_at',
        fields: ['id', 'supplier_id', 'status'].join(','),
        _t: Date.now(),
      },
    });
    const supplierOrders = ordersData?.data || [];

    // 3. Fetch all stock supplier links to find preferred suppliers
    const { data: refsData } = await api.get('/items/stock_item_supplier', {
      params: {
        limit: -1,
        fields: ['id', 'stock_item_id', 'supplier_id', 'supplier_ref', 'is_preferred'].join(','),
        _t: Date.now(),
      },
    });
    const supplierRefs = refsData?.data || [];

    const dispatched: string[] = [];
    const toQualify: string[] = [];
    const errors: Array<{ id: string; error: string }> = [];

    // 4. Process each open purchase request
    for (const req of purchaseRequests) {
      const statusId = typeof req.status === 'string' ? req.status : req.status?.id;
      if (statusId !== 'open' || !req.stock_item_id) {
        continue;
      }

      // Find preferred supplier for this item
      const prefRef = supplierRefs.find(
        (r) => r.stock_item_id === req.stock_item_id && r.is_preferred === true
      );

      if (!prefRef) {
        toQualify.push(req.id);
        continue;
      }

      try {
        // Find or create supplier order for this supplier
        let supplierOrder = supplierOrders.find(
          (o) => o.supplier_id === prefRef.supplier_id && o.status === 'OPEN'
        );

        if (!supplierOrder) {
          // Generate order number: CMD-YYYYMMDD-NNNN
          const today = new Date();
          const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
          const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          const orderNumber = `CMD-${dateStr}-${randomNum}`;
          
          // Create new supplier order for this supplier
          const { data: newOrder } = await api.post('/items/supplier_order', {
            order_number: orderNumber,
            supplier_id: prefRef.supplier_id,
            status: 'OPEN',
            total_amount: 0,
          });
          supplierOrder = newOrder?.data;
          
          // Add to local array so next items use the same basket
          if (supplierOrder) {
            supplierOrders.push(supplierOrder);
          }
        }

        // Create supplier_order_line or update quantity if it already exists
        const { data: existingLineRes } = await api.get('/items/supplier_order_line', {
          params: {
            filter: {
              supplier_order_id: { _eq: supplierOrder.id },
              stock_item_id: { _eq: req.stock_item_id },
            },
            limit: 1,
            fields: ['id', 'quantity'].join(','),
            _t: Date.now(),
          },
        });

        const existingLine = existingLineRes?.data?.[0];

        if (existingLine?.id) {
          // Increment quantity
          await api.patch(`/items/supplier_order_line/${existingLine.id}`, {
            quantity: (existingLine.quantity || 0) + (req.quantity || 1),
          });
        } else {
          await api.post('/items/supplier_order_line', {
            supplier_order_id: supplierOrder.id,
            stock_item_id: req.stock_item_id,
            supplier_ref_snapshot: prefRef.supplier_ref,
            quantity: req.quantity || 1,
            unit_price: null,
            total_price: null,
          });
        }

        // Update purchase request status to in_progress
        await api.patch(`/items/purchase_request/${req.id}`, {
          status: 'in_progress',
        });

        invalidateCache('purchaseRequests');
        invalidateCache('supplierOrders');

        dispatched.push(req.id);
      } catch (err) {
        errors.push({
          id: req.id,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return {
      dispatched,
      toQualify,
      errors,
    };
  }, 'DispatchPurchaseRequests');
};
