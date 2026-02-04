/**
 * Suppliers Datasource - Tunnel Backend
 *
 * Raw HTTP calls to /suppliers endpoints. No mapping, no business logic.
 *
 * @module lib/api/adapters/tunnel/suppliers/datasource
 */

import { tunnelApi } from '@/lib/api/adapters/tunnel/client';

/**
 * Fetch all suppliers with optional filters
 */
export const fetchSuppliersRaw = async (params?: {
  skip?: number;
  limit?: number;
  is_active?: boolean;
  search?: string;
}) => {
  const response = await tunnelApi.get('/suppliers/', { params });
  return Array.isArray(response.data) ? response.data : response.data?.data || [];
};

/**
 * Fetch a single supplier by ID
 */
export const fetchSupplierRaw = async (id: string) => {
  const response = await tunnelApi.get(`/suppliers/${id}`);
  return response.data?.data || response.data || {};
};

/**
 * Fetch supplier by code
 */
export const fetchSupplierByCodeRaw = async (code: string) => {
  const response = await tunnelApi.get(`/suppliers/code/${code}`);
  return response.data?.data || response.data || {};
};

/**
 * Create a new supplier
 */
export const createSupplierRaw = async (payload: Record<string, unknown>) => {
  const response = await tunnelApi.post('/suppliers/', payload);
  return response.data?.data || response.data || {};
};

/**
 * Update an existing supplier
 */
export const updateSupplierRaw = async (id: string, payload: Record<string, unknown>) => {
  const response = await tunnelApi.put(`/suppliers/${id}`, payload);
  return response.data?.data || response.data || {};
};

/**
 * Delete a supplier
 */
export const deleteSupplierRaw = async (id: string) => {
  await tunnelApi.delete(`/suppliers/${id}`);
};
