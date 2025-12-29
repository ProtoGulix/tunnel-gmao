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
