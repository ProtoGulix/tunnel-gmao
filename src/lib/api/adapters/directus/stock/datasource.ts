/*
 * Stock Datasource (Directus)
 * Backend calls only. No mapping, no DTOs, no domain logic.
 * All backend-specific fields and filters must stay here.
 */

import { api } from '@/lib/api/client';
import { apiCall } from '@/lib/api/errors';

// Fetch all purchase requests (raw backend)
export const fetchPurchaseRequestsFromBackend = async () => {
  return apiCall(async () => {
    const { data } = await api.get('/items/purchase_request', {
      params: {
        filter: { status: { _neq: 'received' } },
        limit: -1,
        sort: '-created_at',
        fields: [
          'id','stock_item_id.id','stock_item_id.ref','stock_item_id.supplier_refs.id','item_label','quantity','unit','urgency','requested_by','reason','notes','status','created_at','intervention_id',
        ].join(','),
        _t: Date.now(),
      },
    });
    return data?.data || [];
  }, 'FetchPurchaseRequests');
};

// Fetch purchase requests by intervention (raw backend)
export const fetchPurchaseRequestsByInterventionFromBackend = async (interventionId: string) => {
  return apiCall(async () => {
    const { data } = await api.get('/items/purchase_request', {
      params: {
        filter: { intervention_id: { _eq: interventionId } },
        limit: -1,
        sort: '-created_at',
        fields: [
          'id','stock_item_id.id','stock_item_id.ref','stock_item_id.supplier_refs.id','item_label','quantity','unit','urgency','requested_by','reason','notes','status','created_at','intervention_id',
        ].join(','),
        _t: Date.now(),
      },
    });
    return data?.data || [];
  }, 'FetchPurchaseRequestsByIntervention');
};

// Create purchase request (raw backend)
export const createPurchaseRequestInBackend = async (backendPayload: Record<string, unknown>) => {
  return apiCall(async () => {
    const { data } = await api.post('/items/purchase_request', backendPayload, {
      params: {
        fields: [
          'id','stock_item_id.id','stock_item_id.ref','stock_item_id.supplier_refs.id','item_label','quantity','unit','urgency','requested_by','reason','notes','status','created_at','intervention_id',
        ].join(','),
      },
    });
    return data.data;
  }, 'CreatePurchaseRequest');
};

// Update purchase request (raw backend)
export const updatePurchaseRequestInBackend = async (id: string, backendUpdates: Record<string, unknown>) => {
  return apiCall(async () => {
    const { data } = await api.patch(`/items/purchase_request/${id}`, backendUpdates, {
      params: {
        fields: [
          'id','stock_item_id.id','stock_item_id.ref','stock_item_id.supplier_refs.id','item_label','quantity','unit','urgency','requested_by','reason','notes','status','created_at','intervention_id',
        ].join(','),
      },
    });
    return data.data;
  }, 'UpdatePurchaseRequest');
};

// Delete purchase request (raw backend)
export const deletePurchaseRequestInBackend = async (id: string) => {
  return apiCall(async () => {
    await api.delete(`/items/purchase_request/${id}`);
    return true;
  }, 'DeletePurchaseRequest');
};

// Fetch all stock items (raw backend)
export const fetchStockItemsFromBackend = async () => {
  return apiCall(async () => {
    const params = {
      limit: -1,
      fields: [
        'id','name','family_code','sub_family_code','spec','dimension','ref','quantity','unit','location',
        'supplier_refs_count',
      ].join(','),
      sort: '-ref',
      _t: Date.now(),
    };
    const { data } = await api.get('/items/stock_item', { params });
    return data?.data || [];
  }, 'FetchStockItems');
};

// Create stock item (raw backend)
export const createStockItemInBackend = async (backendPayload: Record<string, unknown>) => {
  return apiCall(async () => {
    const { data } = await api.post('/items/stock_item', backendPayload);
    return data.data;
  }, 'CreateStockItem');
};

// Update stock item (raw backend)
export const updateStockItemInBackend = async (id: string, backendUpdates: Record<string, unknown>) => {
  return apiCall(async () => {
    const { data } = await api.patch(`/items/stock_item/${id}`, backendUpdates);
    return data.data;
  }, 'UpdateStockItem');
};

// Delete stock item (raw backend)
export const deleteStockItemInBackend = async (id: string) => {
  return apiCall(async () => {
    await api.delete(`/items/stock_item/${id}`);
    return true;
  }, 'DeleteStockItem');
};

// Fetch stock item standard specs (raw backend)
export const fetchStockItemStandardSpecsFromBackend = async (stockItemId: string) => {
  return apiCall(async () => {
    const params = {
      filter: { stock_item_id: { _eq: stockItemId } },
      limit: -1,
      sort: '-created_at',
      fields: [
        'id','stock_item_id','title','spec_text','is_default','created_at','updated_at',
      ].join(','),
      _t: Date.now(),
    };
    const { data } = await api.get('/items/stock_item_standard_spec', { params });
    return data?.data || [];
  }, 'FetchStockItemStandardSpecs');
};

// Create stock item standard spec (raw backend)
export const createStockItemStandardSpecInBackend = async (backendPayload: Record<string, unknown>) => {
  return apiCall(async () => {
    const { data } = await api.post('/items/stock_item_standard_spec', backendPayload);
    return data.data;
  }, 'CreateStockItemStandardSpec');
};

// Update stock item standard spec (raw backend)
export const updateStockItemStandardSpecInBackend = async (id: string, backendUpdates: Record<string, unknown>) => {
  return apiCall(async () => {
    const { data } = await api.patch(`/items/stock_item_standard_spec/${id}`, backendUpdates);
    return data.data;
  }, 'UpdateStockItemStandardSpec');
};

// Delete stock item standard spec (raw backend)
export const deleteStockItemStandardSpecInBackend = async (id: string) => {
  return apiCall(async () => {
    await api.delete(`/items/stock_item_standard_spec/${id}`);
    return true;
  }, 'DeleteStockItemStandardSpec');
};

// Fetch stock families (raw backend)
export const fetchStockFamiliesFromBackend = async () => {
  return apiCall(async () => {
    const { data } = await api.get('/items/stock_family', {
      params: {
        limit: -1,
        fields: ['code','label'].join(','),
        sort: 'label',
        _t: Date.now(),
      },
    });
    return data?.data || [];
  }, 'FetchStockFamilies');
};

// Fetch stock subfamilies (raw backend)
export const fetchStockSubFamiliesFromBackend = async (familyCode: string) => {
  return apiCall(async () => {
    const { data } = await api.get('/items/stock_sub_family', {
      params: {
        filter: { family_code: { _eq: familyCode } },
        limit: -1,
        fields: ['id','family_code','code','label'].join(','),
        sort: 'label',
        _t: Date.now(),
      },
    });
    return data?.data || [];
  }, 'FetchStockSubFamilies');
};

// Create stock family (raw backend)
export const createStockFamilyInBackend = async (backendPayload: Record<string, unknown>) => {
  return apiCall(async () => {
    const { data } = await api.post('/items/stock_family', backendPayload);
    return data.data;
  }, 'CreateStockFamily');
};

// Update stock family (raw backend)
export const updateStockFamilyInBackend = async (code: string, backendUpdates: Record<string, unknown>) => {
  return apiCall(async () => {
    const { data } = await api.patch(`/items/stock_family/${code}`, backendUpdates);
    return data.data;
  }, 'UpdateStockFamily');
};

// Delete stock family (raw backend)
export const deleteStockFamilyInBackend = async (code: string) => {
  return apiCall(async () => {
    await api.delete(`/items/stock_family/${code}`);
    return true;
  }, 'DeleteStockFamily');
};

// Create stock subfamily (raw backend)
export const createStockSubFamilyInBackend = async (backendPayload: Record<string, unknown>) => {
  return apiCall(async () => {
    const { data } = await api.post('/items/stock_sub_family', backendPayload);
    return data.data;
  }, 'CreateStockSubFamily');
};

// Update stock subfamily (raw backend)
export const updateStockSubFamilyInBackend = async (id: string, backendUpdates: Record<string, unknown>) => {
  return apiCall(async () => {
    const { data } = await api.patch(`/items/stock_sub_family/${id}`, backendUpdates);
    return data.data;
  }, 'UpdateStockSubFamily');
};

// Delete stock subfamily (raw backend)
export const deleteStockSubFamilyInBackend = async (id: string) => {
  return apiCall(async () => {
    await api.delete(`/items/stock_sub_family/${id}`);
    return true;
  }, 'DeleteStockSubFamily');
};
