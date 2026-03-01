/**
 * Stock / Purchase Requests API
 *
 * @module api/stock
 */

import { api } from '@/lib/api/client';

/**
 * Create a purchase request
 * @param {Object} payload - Purchase request data
 * @param {string} payload.item_label - Item label
 * @param {number} payload.quantity - Quantity
 * @param {string} payload.unit - Unit
 * @param {string} payload.urgency - Urgency level
 * @param {string} payload.requested_by - Requester identifier
 * @param {number} [payload.stock_item_id] - Stock item ID if linked
 * @param {number} [payload.intervention_id] - Intervention ID if linked
 * @param {string} [payload.reason] - Reason for request
 * @param {string} [payload.notes] - Additional notes
 * @returns {Promise<Object>} Created purchase request
 */
export async function createPurchaseRequest(payload) {
  const response = await api.post('/purchase-requests/', payload);
  return response.data || null;
}

/**
 * Delete a purchase request
 * @param {string|number} id - Purchase request ID
 * @returns {Promise<void>}
 */
export async function deletePurchaseRequest(id) {
  await api.delete(`/purchase-requests/${id}`);
}

/**
 * Fetch purchase requests with optional filters
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} Array of purchase requests
 */
export async function fetchPurchaseRequests(params = {}) {
  const response = await api.get('/purchase-requests/list', { params });
  return response.data || [];
}

/**
 * Update a purchase request
 * @param {string|number} id - Purchase request ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated purchase request
 */
export async function updatePurchaseRequest(id, updates) {
  const response = await api.patch(`/purchase-requests/${id}`, updates);
  return response.data || null;
}

/**
 * Fetch stock items with optional search/filters
 * @param {Object} params - Query parameters
 * @param {string} [params.search] - Search term
 * @returns {Promise<Object>} Stock items paginated response
 */
export async function fetchStockItems(params = {}) {
  const response = await api.get('/stock-items/', { params });
  return response.data || { items: [], pagination: {} };
}

/**
 * Fetch stock families
 * @returns {Promise<Array>} Array of families
 */
export async function fetchStockFamilies() {
  const response = await api.get('/stock-families/');
  return response.data || [];
}

/**
 * Fetch stock family detail
 * @param {string} familyCode - Family code
 * @param {Object} params - Query parameters
 * @param {string} [params.search] - Search filter for sub-families
 * @returns {Promise<Object>} Family detail with sub-families
 */
export async function fetchStockFamilyDetail(familyCode, params = {}) {
  const response = await api.get(`/stock-families/${familyCode}`, { params });
  return response.data || null;
}

/**
 * Fetch stock sub families
 * @returns {Promise<Array>} Array of sub families
 */
export async function fetchStockSubFamilies() {
  const response = await api.get('/stock-sub-families/');
  return response.data || [];
}

/**
 * Fetch stock sub family detail
 * @param {string} familyCode - Family code
 * @param {string} subFamilyCode - Sub family code
 * @returns {Promise<Object>} Sub family detail
 */
export async function fetchStockSubFamily(familyCode, subFamilyCode) {
  const response = await api.get(`/stock-sub-families/${familyCode}/${subFamilyCode}`);
  return response.data || null;
}

/**
 * Update stock sub family
 * @param {string} familyCode - Family code
 * @param {string} subFamilyCode - Sub family code
 * @param {Object} updates - Updates payload
 * @returns {Promise<Object>} Updated sub family
 */
export async function updateStockSubFamily(familyCode, subFamilyCode, updates) {
  const response = await api.patch(`/stock-sub-families/${familyCode}/${subFamilyCode}`, updates);
  return response.data || null;
}
