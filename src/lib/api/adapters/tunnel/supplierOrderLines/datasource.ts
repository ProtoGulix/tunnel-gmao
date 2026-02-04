/**
 * Supplier Order Lines Datasource - Tunnel Backend
 *
 * Raw HTTP calls. No mapping, no business logic.
 *
 * @module lib/api/adapters/tunnel/supplierOrderLines/datasource
 */

import { tunnelApi } from '@/lib/api/adapters/tunnel/client';

/**
 * Fetch all supplier order lines with optional filters
 */
export const fetchSupplierOrderLinesRaw = async (params?: {
  skip?: number;
  limit?: number;
  supplier_order_id?: string;
  stock_item_id?: string;
  is_selected?: boolean;
}) => {
  const response = await tunnelApi.get('/supplier_order_lines/', { params });
  return Array.isArray(response.data) ? response.data : response.data?.data || [];
};

/**
 * Fetch a single supplier order line by ID
 */
export const fetchSupplierOrderLineRaw = async (id: string) => {
  const response = await tunnelApi.get(`/supplier_order_lines/${id}`);
  return response.data?.data || response.data || {};
};

/**
 * Fetch all lines for a supplier order
 */
export const fetchSupplierOrderLinesByOrderRaw = async (supplierOrderId: string) => {
  const response = await tunnelApi.get(`/supplier_order_lines/order/${supplierOrderId}`);
  return Array.isArray(response.data) ? response.data : response.data?.data || [];
};

/**
 * Create a new supplier order line
 */
export const createSupplierOrderLineRaw = async (payload: Record<string, unknown>) => {
  const response = await tunnelApi.post('/supplier_order_lines/', payload);
  return response.data?.data || response.data || {};
};

/**
 * Update an existing supplier order line
 */
export const updateSupplierOrderLineRaw = async (id: string, payload: Record<string, unknown>) => {
  const response = await tunnelApi.put(`/supplier_order_lines/${id}`, payload);
  return response.data?.data || response.data || {};
};

/**
 * Delete a supplier order line
 */
export const deleteSupplierOrderLineRaw = async (id: string) => {
  await tunnelApi.delete(`/supplier_order_lines/${id}`);
};

/**
 * Link a purchase request to a line
 */
export const linkPurchaseRequestRaw = async (lineId: string, payload: {
  purchase_request_id: string;
  quantity: number;
}) => {
  const response = await tunnelApi.post(`/supplier_order_lines/${lineId}/purchase_requests`, payload);
  return response.data?.data || response.data || {};
};

/**
 * Unlink a purchase request from a line
 */
export const unlinkPurchaseRequestRaw = async (lineId: string, purchaseRequestId: string) => {
  await tunnelApi.delete(`/supplier_order_lines/${lineId}/purchase_requests/${purchaseRequestId}`);
};
