/**
 * Supplier Orders & Lines API
 *
 * @module api/supplierOrders
 */

import { api } from '@/lib/api/client';

// ─── Supplier Orders ────────────────────────────────────────────────────────

/**
 * Fetch supplier orders with optional filters
 * @param {Object} params
 * @param {string} [params.status] - OPEN | SENT | ACK | RECEIVED | CLOSED | CANCELLED
 * @param {string} [params.supplier_id]
 * @returns {Promise<Array>}
 */
export async function fetchSupplierOrders(params = {}) {
  const response = await api.get('/supplier-orders/', { params });
  return Array.isArray(response.data) ? response.data : response.data?.data || [];
}

/**
 * Fetch supplier order detail (includes lines)
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function fetchSupplierOrderDetail(id) {
  const response = await api.get(`/supplier-orders/${id}`);
  return response.data?.data || response.data || {};
}

/**
 * Create a supplier order
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export async function createSupplierOrder(payload) {
  const response = await api.post('/supplier-orders/', payload);
  return response.data?.data || response.data || {};
}

/**
 * Update a supplier order
 * @param {string} id
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
export async function updateSupplierOrder(id, updates) {
  const response = await api.put(`/supplier-orders/${id}`, updates);
  return response.data?.data || response.data || {};
}

/**
 * Delete a supplier order
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteSupplierOrder(id) {
  await api.delete(`/supplier-orders/${id}`);
}

/**
 * Export supplier order as CSV (returns blob)
 * @param {string} id
 * @returns {Promise<Blob>}
 */
export async function exportSupplierOrderCsv(id) {
  const response = await api.post(`/supplier-orders/${id}/export/csv`, {}, { responseType: 'blob' });
  return response.data;
}

// ─── Supplier Order Lines ───────────────────────────────────────────────────

/**
 * Fetch all lines for a supplier order
 * @param {string} supplierOrderId
 * @returns {Promise<Array>}
 */
export async function fetchSupplierOrderLines(supplierOrderId) {
  const response = await api.get(`/supplier-order-lines/order/${supplierOrderId}`);
  return Array.isArray(response.data) ? response.data : response.data?.data || [];
}

/**
 * Update a supplier order line
 * @param {string} id
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
export async function updateSupplierOrderLine(id, updates) {
  const response = await api.put(`/supplier-order-lines/${id}`, updates);
  return response.data?.data || response.data || {};
}

/**
 * Delete a supplier order line
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteSupplierOrderLine(id) {
  await api.delete(`/supplier-order-lines/${id}`);
}
