/**
 * Supplier Orders & Lines API
 *
 * @module api/supplierOrders
 */

import { api } from '@/lib/api/client';

// ─── Supplier Orders ────────────────────────────────────────────────────────

/**
 * Fetch supplier order statuses with labels and colors
 * @returns {Promise<Array<{code, label, color}>>}
 */
export async function fetchSupplierOrderStatuses() {
  const response = await api.get('/supplier-orders/statuses');
  return response.data;
}

/**
 * Fetch supplier orders with optional filters
 * @param {Object} params
 * @param {string} [params.status] - OPEN | SENT | ACK | RECEIVED | CLOSED | CANCELLED
 * @param {string} [params.supplier_id]
 * @param {number} [params.skip]
 * @param {number} [params.limit]
 * @returns {Promise<{items: Array, pagination: Object, facets: Array}>}
 */
export async function fetchSupplierOrders(params = {}) {
  const response = await api.get('/supplier-orders', { params });
  const { items = [], pagination = null, facets = [] } = response.data;
  return { items, pagination, facets };
}

/**
 * Fetch supplier order detail (includes lines)
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function fetchSupplierOrderDetail(id) {
  const response = await api.get(`/supplier-orders/${id}`);
  return response.data;
}

/**
 * Create a supplier order
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export async function createSupplierOrder(payload) {
  const response = await api.post('/supplier-orders', payload);
  return response.data;
}

/**
 * Update a supplier order
 * @param {string} id
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
export async function updateSupplierOrder(id, updates) {
  const response = await api.put(`/supplier-orders/${id}`, updates);
  return response.data;
}

/**
 * Fetch allowed status transitions from current status
 * @param {string} id
 * @returns {Promise<{current_status: string, transitions: Array<{to: string, description: string}>}>}
 */
export async function fetchSupplierOrderTransitions(id) {
  const response = await api.get(`/supplier-orders/${id}/transitions`);
  return response.data;
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
 * Export supplier order as email draft (returns mailto_url + subject + body)
 * @param {string} id
 * @returns {Promise<{subject: string, body_text: string, body_html: string, supplier_email: string|null, mailto_url: string|null}>}
 */
export async function exportSupplierOrderEmail(id) {
  const response = await api.post(`/supplier-orders/${id}/export/email`);
  return response.data;
}

/**
 * Export supplier order as CSV (returns blob)
 * @param {string} id
 * @returns {Promise<Blob>}
 */
export async function exportSupplierOrderCsv(id) {
  const response = await api.post(
    `/supplier-orders/${id}/export/csv`,
    {},
    { responseType: 'blob' }
  );
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
  return response.data;
}

/**
 * Partially update a supplier order line (PATCH)
 * @param {string} id
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
export async function updateSupplierOrderLine(id, updates) {
  const response = await api.patch(`/supplier-order-lines/${id}`, updates);
  return response.data;
}

/**
 * Delete a supplier order line
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteSupplierOrderLine(id) {
  await api.delete(`/supplier-order-lines/${id}`);
}
