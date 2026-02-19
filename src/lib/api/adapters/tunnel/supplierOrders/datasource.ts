/**
 * Supplier Orders Datasource - Tunnel Backend
 *
 * Raw HTTP calls. No mapping, no business logic.
 *
 * @module lib/api/adapters/tunnel/supplierOrders/datasource
 */

import { tunnelApi } from '@/lib/api/adapters/tunnel/client';

/**
 * Fetch all supplier orders with optional filters
 */
export const fetchSupplierOrdersRaw = async (params?: {
  skip?: number;
  limit?: number;
  status?: string;
  supplier_id?: string;
}) => {
  const response = await tunnelApi.get('/supplier-orders/', { params });
  return Array.isArray(response.data) ? response.data : response.data?.data || [];
};

/**
 * Fetch a single supplier order by ID with lines
 */
export const fetchSupplierOrderRaw = async (id: string) => {
  const response = await tunnelApi.get(`/supplier-orders/${id}`);
  return response.data?.data || response.data || {};
};

/**
 * Fetch supplier order by order number
 */
export const fetchSupplierOrderByNumberRaw = async (orderNumber: string) => {
  const response = await tunnelApi.get(`/supplier-orders/number/${orderNumber}`);
  return response.data?.data || response.data || {};
};

/**
 * Create a new supplier order
 */
export const createSupplierOrderRaw = async (payload: Record<string, unknown>) => {
  const response = await tunnelApi.post('/supplier-orders/', payload);
  return response.data?.data || response.data || {};
};

/**
 * Update an existing supplier order
 */
export const updateSupplierOrderRaw = async (id: string, payload: Record<string, unknown>) => {
  const response = await tunnelApi.put(`/supplier-orders/${id}`, payload);
  return response.data?.data || response.data || {};
};

/**
 * Delete a supplier order
 */
export const deleteSupplierOrderRaw = async (id: string) => {
  await tunnelApi.delete(`/supplier-orders/${id}`);
};

/**
 * Export supplier order as CSV
 */
export const exportSupplierOrderCSVRaw = async (id: string) => {
  const response = await tunnelApi.get(`/supplier-orders/${id}/export/csv`, {
    responseType: 'blob',
  });
  return response.data;
};

/**
 * Export supplier order as email
 * @param id - Supplier order ID
 * @param format - 'text' or 'html'
 */
export const exportSupplierOrderEmailRaw = async (id: string, format: 'text' | 'html' = 'text') => {
  const response = await tunnelApi.post(`/supplier-orders/${id}/export/email`, {
    format,
  });
  return response.data?.data || response.data || {};
};
