/**
 * Stock Item Suppliers Datasource - Tunnel Backend
 *
 * Raw HTTP calls to /stock_item_suppliers endpoints. No mapping, no business logic.
 *
 * @module lib/api/adapters/tunnel/stockSuppliers/datasource
 */

import { tunnelApi } from '@/lib/api/adapters/tunnel/client';

/**
 * Fetch all stock item supplier references with optional filters
 */
export const fetchStockItemSuppliersRaw = async (params?: {
  skip?: number;
  limit?: number;
  stock_item_id?: string;
  supplier_id?: string;
  is_preferred?: boolean;
}) => {
  const response = await tunnelApi.get('/stock_item_suppliers/', { params });
  return Array.isArray(response.data) ? response.data : response.data?.data || [];
};

/**
 * Fetch a single stock item supplier reference by ID
 */
export const fetchStockItemSupplierRaw = async (id: string) => {
  const response = await tunnelApi.get(`/stock_item_suppliers/${id}`);
  return response.data?.data || response.data || {};
};

/**
 * Fetch all supplier references for a stock item
 */
export const fetchStockItemSuppliersForItemRaw = async (stockItemId: string) => {
  const response = await tunnelApi.get(`/stock_item_suppliers/stock_item/${stockItemId}`);
  return Array.isArray(response.data) ? response.data : response.data?.data || [];
};

/**
 * Fetch all stock item references for a supplier
 */
export const fetchStockItemSuppliersForSupplierRaw = async (supplierId: string) => {
  const response = await tunnelApi.get(`/stock_item_suppliers/supplier/${supplierId}`);
  return Array.isArray(response.data) ? response.data : response.data?.data || [];
};

/**
 * Create a new stock item supplier reference
 */
export const createStockItemSupplierRaw = async (payload: Record<string, unknown>) => {
  const response = await tunnelApi.post('/stock_item_suppliers/', payload);
  return response.data?.data || response.data || {};
};

/**
 * Update an existing stock item supplier reference
 */
export const updateStockItemSupplierRaw = async (id: string, payload: Record<string, unknown>) => {
  const response = await tunnelApi.put(`/stock_item_suppliers/${id}`, payload);
  return response.data?.data || response.data || {};
};

/**
 * Set a reference as preferred
 */
export const setPreferredStockItemSupplierRaw = async (id: string) => {
  const response = await tunnelApi.post(`/stock_item_suppliers/${id}/set_preferred`, {});
  return response.data?.data || response.data || {};
};

/**
 * Delete a stock item supplier reference
 */
export const deleteStockItemSupplierRaw = async (id: string) => {
  await tunnelApi.delete(`/stock_item_suppliers/${id}`);
};
