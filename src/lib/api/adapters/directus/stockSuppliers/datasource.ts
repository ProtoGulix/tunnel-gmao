// Directus datasource for stock-supplier links domain
import { api, invalidateCache } from '@/lib/api/client';
import { apiCall } from '@/lib/api/errors';

export const fetchStockItemSuppliers = async (stockItemId: string) => {
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
          'manufacturer_item_id.id',
          'manufacturer_item_id.manufacturer_name',
          'manufacturer_item_id.manufacturer_ref',
          'manufacturer_item_id.designation',
        ].join(','),
        _t: Date.now(),
      },
    });
    const result = data?.data || [];
    return result;
  }, 'FetchStockItemSuppliers');
};

export const fetchSupplierRefsBySupplier = async (supplierId: string) => {
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
    return data?.data || [];
  }, 'FetchSupplierRefsBySupplier');
};

export const createStockItemSupplier = async (payload: Record<string, unknown>) => {
  return apiCall(async () => {
    const { data } = await api.post('/items/stock_item_supplier', payload);
    const stockItemId = payload.stock_item_id;
    invalidateCache('stockSuppliers');
    if (stockItemId) {
      invalidateCache(`stockItems:${stockItemId}`);
    }
    return data?.data;
  }, 'CreateStockItemSupplier');
};

export const updateStockItemSupplier = async (id: string, updates: Record<string, unknown>) => {
  return apiCall(async () => {
    const { data } = await api.patch(`/items/stock_item_supplier/${id}`, updates);
    const stockItemId = updates.stock_item_id;
    invalidateCache('stockSuppliers');
    if (stockItemId) {
      invalidateCache(`stockItems:${stockItemId}`);
    }
    return data?.data;
  }, 'UpdateStockItemSupplier');
};

export const deleteStockItemSupplier = async (id: string) => {
  return apiCall(async () => {
    await api.delete(`/items/stock_item_supplier/${id}`);
    invalidateCache('stockSuppliers');
    return true;
  }, 'DeleteStockItemSupplier');
};
