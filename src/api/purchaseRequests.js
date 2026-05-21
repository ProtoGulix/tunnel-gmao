/**
 * Purchase Requests API
 *
 * @module api/purchaseRequests
 */

import { api } from '@/lib/api/client';

/**
 * Fetch purchase requests (light list for table)
 * @param {Object} params
 * @param {string} [params.status]
 * @param {string} [params.urgency]
 * @param {string} [params.search]
 * @param {string} [params.intervention_id]
 * @returns {Promise<Array>}
 */
export async function fetchPurchaseRequests(params = {}) {
  const response = await api.get('/purchase-requests/list', { params });
  return response.data ?? [];
}

/**
 * Fetch detailed purchase request by ID
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function fetchPurchaseRequestDetail(id) {
  const response = await api.get(`/purchase-requests/detail/${id}`);
  return response.data;
}

/**
 * Fetch purchase requests stats
 * @param {Object} params
 * @param {string} [params.start_date]
 * @param {string} [params.end_date]
 * @returns {Promise<Object>}
 */
export async function fetchPurchaseRequestStats(params = {}) {
  const response = await api.get('/purchase-requests/stats', { params });
  return response.data;
}

/**
 * Fetch purchase requests for an intervention
 * @param {string} interventionId
 * @param {string} [view='list'] - 'list' or 'full'
 * @returns {Promise<Array>}
 */
export async function fetchPurchaseRequestsByIntervention(interventionId, view = 'list') {
  const response = await api.get(`/purchase-requests/intervention/${interventionId}/optimized`, {
    params: { view },
  });
  return response.data ?? [];
}

/**
 * Create a purchase request
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export async function createPurchaseRequest(payload) {
  const response = await api.post('/purchase-requests', payload);
  return response.data;
}

/**
 * Update a purchase request
 * @param {string} id
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
export async function updatePurchaseRequest(id, updates) {
  const response = await api.put(`/purchase-requests/${id}`, updates);
  return response.data;
}

/**
 * Delete a purchase request
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deletePurchaseRequest(id) {
  await api.delete(`/purchase-requests/${id}`);
}

/**
 * Fetch all possible derived statuses with labels and colors
 * @returns {Promise<Array>} [{ code, label, color }]
 */
export async function fetchPurchaseRequestStatuses() {
  const response = await api.get('/purchase-requests/statuses');
  return response.data;
}

/**
 * Dispatch all PENDING_DISPATCH purchase requests to supplier orders
 * @returns {Promise<Object>} { dispatched_count, created_orders, errors, details }
 */
export async function dispatchPurchaseRequests() {
  const response = await api.post('/purchase-requests/dispatch');
  return response.data;
}
