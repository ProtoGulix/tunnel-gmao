/**
 * Stock Items Datasource - Tunnel Backend
 *
 * Raw HTTP calls to /stock_items endpoints. No mapping, no business logic.
 *
 * @module lib/api/adapters/tunnel/stock/datasource
 */

import { tunnelApi } from '@/lib/api/adapters/tunnel/client';

/**
 * Fetch all stock items with optional filters
 */
export const fetchStockItemsRaw = async (params?: {
  skip?: number;
  limit?: number;
  family_code?: string;
  sub_family_code?: string;
  search?: string;
}) => {
  const response = await tunnelApi.get('/stock_items/', { params });
  return Array.isArray(response.data) ? response.data : response.data?.data || [];
};

/**
 * Fetch a single stock item by ID
 */
export const fetchStockItemRaw = async (id: string) => {
  const response = await tunnelApi.get(`/stock_items/${id}`);
  return response.data?.data || response.data || {};
};

/**
 * Fetch stock item by reference
 */
export const fetchStockItemByRefRaw = async (ref: string) => {
  const response = await tunnelApi.get(`/stock_items/ref/${ref}`);
  return response.data?.data || response.data || {};
};

/**
 * Create a new stock item
 */
export const createStockItemRaw = async (payload: Record<string, unknown>) => {
  const response = await tunnelApi.post('/stock_items/', payload);
  return response.data?.data || response.data || {};
};

/**
 * Update an existing stock item
 */
export const updateStockItemRaw = async (id: string, payload: Record<string, unknown>) => {
  const response = await tunnelApi.put(`/stock_items/${id}`, payload);
  return response.data?.data || response.data || {};
};

/**
 * Delete a stock item
 */
export const deleteStockItemRaw = async (id: string) => {
  await tunnelApi.delete(`/stock_items/${id}`);
};
