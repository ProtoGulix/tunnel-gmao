/**
 * Purchase Requests Datasource - Tunnel Backend
 *
 * Raw HTTP calls. No mapping, no business logic.
 *
 * @module lib/api/adapters/tunnel/purchaseRequests/datasource
 */

import { tunnelApi } from '@/lib/api/adapters/tunnel/client';

/**
 * Fetch all purchase requests with optional filters
 */
export const fetchPurchaseRequestsRaw = async (params?: {
  skip?: number;
  limit?: number;
  status?: string;
  intervention_id?: string;
  urgency?: string;
}) => {
  const response = await tunnelApi.get('/purchase-requests/', { params });
  return Array.isArray(response.data) ? response.data : response.data?.data || [];
};

/**
 * Fetch a single purchase request by ID
 */
export const fetchPurchaseRequestRaw = async (id: string) => {
  const response = await tunnelApi.get(`/purchase-requests/${id}`);
  return response.data?.data || response.data || {};
};

/**
 * Fetch purchase requests for a specific intervention
 */
export const fetchPurchaseRequestsByInterventionRaw = async (interventionId: string) => {
  const response = await tunnelApi.get(`/purchase-requests/intervention/${interventionId}`);
  return Array.isArray(response.data) ? response.data : response.data?.data || [];
};

/**
 * Create a new purchase request
 */
export const createPurchaseRequestRaw = async (payload: Record<string, unknown>) => {
  const response = await tunnelApi.post('/purchase-requests/', payload);
  return response.data?.data || response.data || {};
};

/**
 * Update an existing purchase request
 */
export const updatePurchaseRequestRaw = async (id: string, payload: Record<string, unknown>) => {
  const response = await tunnelApi.put(`/purchase-requests/${id}`, payload);
  return response.data?.data || response.data || {};
};

/**
 * Delete a purchase request
 */
export const deletePurchaseRequestRaw = async (id: string) => {
  await tunnelApi.delete(`/purchase-requests/${id}`);
};

/**
 * Fetch purchase requests statistics
 */
export const fetchPurchaseRequestStatsRaw = async (params?: {
  start_date?: string;
  end_date?: string;
  group_by?: string;
}) => {
  const response = await tunnelApi.get('/purchase-requests/stats', { params });
  return response.data?.data || response.data || {};
};
