// Directus datasource for stock specs domain
import { api, invalidateCache } from '@/lib/api/client';
import { apiCall } from '@/lib/api/errors';

export const fetchStockSpecs = async (searchTerm = '') => {
  return apiCall(async () => {
    const params: Record<string, unknown> = {
      limit: -1,
      fields: [
        'id',
        'stock_item_id',
        'title',
        'spec_text',
        'is_default',
        'created_at',
        'stock_item_id.id',
        'stock_item_id.name',
        'stock_item_id.ref',
      ].join(','),
      sort: '-created_at',
      _t: Date.now(),
    };

    if (searchTerm && searchTerm.trim()) {
      params.filter = {
        _or: [
          { title: { _icontains: searchTerm.trim() } },
          { spec_text: { _icontains: searchTerm.trim() } },
        ],
      };
    }

    const { data } = await api.get('/items/stock_item_standard_spec', { params });
    return data?.data || [];
  }, 'FetchStockSpecs');
};

export const fetchStockSpecsForItem = async (stockItemId: string) => {
  return apiCall(async () => {
    const { data } = await api.get('/items/stock_item_standard_spec', {
      params: {
        filter: { stock_item_id: { _eq: stockItemId } },
        fields: [
          'id',
          'stock_item_id',
          'title',
          'spec_text',
          'is_default',
          'created_at',
        ].join(','),
        sort: '-created_at',
        _t: Date.now(),
      },
    });
    return data?.data || [];
  }, 'FetchStockSpecsForItem');
};

export const fetchStockSpec = async (id: string) => {
  return apiCall(async () => {
    const { data } = await api.get(`/items/stock_item_standard_spec/${id}`, {
      params: {
        fields: ['title', 'spec_text', 'is_default'].join(','),
      },
    });
    return data?.data;
  }, 'FetchStockSpec');
};

export const createStockSpec = async (payload: Record<string, unknown>) => {
  return apiCall(async () => {
    const { data } = await api.post('/items/stock_item_standard_spec', payload);
    const stockItemId = payload.stock_item_id;
    invalidateCache('stockSpecs');
    if (stockItemId) {
      invalidateCache(`stockItems:${stockItemId}`);
    }
    return data?.data;
  }, 'CreateStockSpec');
};
