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
 * @returns {Promise<Object>} Created purchase request
 */
export async function createPurchaseRequest(payload) {
  const response = await api.post('/items/purchase_request', payload);
  return response.data?.data || null;
}

/**
 * Delete a purchase request
 * @param {string|number} id - Purchase request ID
 * @returns {Promise<void>}
 */
export async function deletePurchaseRequest(id) {
  await api.delete(`/items/purchase_request/${id}`);
}

/**
 * Fetch purchase requests with optional filters
 * @param {Object} params - Query parameters
 * @returns {Promise<Array>} Array of purchase requests
 */
export async function fetchPurchaseRequests(params = {}) {
  const response = await api.get('/items/purchase_request', { params });
  return response.data?.data || [];
}

/**
 * Update a purchase request
 * @param {string|number} id - Purchase request ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated purchase request
 */
export async function updatePurchaseRequest(id, updates) {
  const response = await api.patch(`/items/purchase_request/${id}`, updates);
  return response.data?.data || null;
}

/**
 * Fetch stock items with optional search/filters
 * @param {Object} params - Query parameters
 * @param {string} [params.search] - Search term
 * @returns {Promise<Array>} Array of stock items
 */
export async function fetchStockItems(params = {}) {
  // TODO: Implement proper stock items endpoint
  // For now, return empty array to allow compilation
  return [];
}
