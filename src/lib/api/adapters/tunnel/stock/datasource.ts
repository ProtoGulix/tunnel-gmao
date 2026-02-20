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
 * Returns paginated response with metadata
 */
export const fetchStockItemsRaw = async (params?: {
  skip?: number;
  limit?: number;
  family_code?: string;
  sub_family_code?: string;
  search?: string;
}) => {
  const response = await tunnelApi.get('/stock-items/', { params });
  // API v2.x returns { items: [...], pagination: {...} }
  return response.data;
};

/**
 * Fetch a single stock item by ID
 */
export const fetchStockItemRaw = async (id: string) => {
  const response = await tunnelApi.get(`/stock-items/${id}`);
  return response.data?.data || response.data || {};
};

/**
 * Fetch stock item by reference
 */
export const fetchStockItemByRefRaw = async (ref: string) => {
  const response = await tunnelApi.get(`/stock-items/ref/${ref}`);
  return response.data?.data || response.data || {};
};

/**
 * Create a new stock item
 */
export const createStockItemRaw = async (payload: Record<string, unknown>) => {
  const response = await tunnelApi.post('/stock-items/', payload);
  return response.data?.data || response.data || {};
};

/**
 * Update an existing stock item
 */
export const updateStockItemRaw = async (id: string, payload: Record<string, unknown>) => {
  const response = await tunnelApi.put(`/stock-items/${id}`, payload);
  return response.data?.data || response.data || {};
};

/**
 * Delete a stock item
 */
export const deleteStockItemRaw = async (id: string) => {
  await tunnelApi.delete(`/stock-items/${id}`);
};

/**
 * Fetch all stock subfamilies with templates (v1.11.0)
 */
export const fetchStockSubFamiliesRaw = async (familyCode?: string) => {
  const params = familyCode ? { family_code: familyCode } : {};
  const response = await tunnelApi.get('/stock-sub-families/', { params });
  return Array.isArray(response.data) ? response.data : response.data?.data || [];
};

/**
 * Fetch a single stock subfamily with template (v1.4.0)
 */
export const fetchStockSubFamilyRaw = async (familyCode: string, subFamilyCode: string) => {
  const response = await tunnelApi.get(`/stock-sub-families/${familyCode}/${subFamilyCode}`);
  return response.data?.data || response.data || {};
};

/**
 * Update a stock subfamily (label and/or template_id) (v1.4.0)
 */
export const updateStockSubFamilyRaw = async (
  familyCode: string,
  subFamilyCode: string,
  updates: { label?: string; template_id?: string | null }
) => {
  const response = await tunnelApi.patch(`/stock-sub-families/${familyCode}/${subFamilyCode}`, updates);
  return response.data?.data || response.data || {};
};

/**
 * Fetch all stock families (v2.1.0 - READ ONLY)
 * Returns list of families with subfamily count
 */
export const fetchStockFamiliesRaw = async () => {
  const response = await tunnelApi.get('/stock-families/');
  return Array.isArray(response.data) ? response.data : response.data?.data || [];
};

/**
 * Fetch a single stock family by code (v2.1.0 - READ ONLY)
 * Returns family with all subfamilies
 */
export const fetchStockFamilyRaw = async (familyCode: string) => {
  const response = await tunnelApi.get(`/stock-families/${familyCode}`);
  return response.data?.data || response.data || {};
};

/**
 * Create stock subfamily (v2.1.0)
 */
export const createStockSubFamilyRaw = async (payload: { family_code: string; code: string; label: string; template_id?: string | null }) => {
  const response = await tunnelApi.post('/stock-sub-families', payload);
  return response.data?.data || response.data || {};
};

/**
 * Delete stock subfamily (v2.1.0)
 */
export const deleteStockSubFamilyRaw = async (familyCode: string, subFamilyCode: string) => {
  await tunnelApi.delete(`/stock-sub-families/${familyCode}/${subFamilyCode}`);
};
