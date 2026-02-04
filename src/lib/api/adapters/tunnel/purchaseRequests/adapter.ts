/**
 * Purchase Requests Adapter - Tunnel Backend
 *
 * Orchestrates datasource and mapper for purchase requests.
 *
 * @module lib/api/adapters/tunnel/purchaseRequests/adapter
 */

import * as datasource from './datasource';
import * as mapper from './mapper';
import { apiCall } from '@/lib/api/errors';

export const purchaseRequestsAdapter = {
  async fetchPurchaseRequests(params?: {
    skip?: number;
    limit?: number;
    status?: string;
    interventionId?: string;
    urgency?: string;
  }) {
    return apiCall(async () => {
      const backendParams = params ? {
        skip: params.skip,
        limit: params.limit,
        status: params.status,
        intervention_id: params.interventionId,
        urgency: params.urgency,
      } : undefined;

      const raw = await datasource.fetchPurchaseRequestsRaw(backendParams);
      return raw.map(mapper.mapPurchaseRequestToDomain).filter(Boolean);
    }, 'TunnelPurchaseRequests.fetchPurchaseRequests');
  },

  async fetchPurchaseRequest(id: string) {
    return apiCall(async () => {
      const raw = await datasource.fetchPurchaseRequestRaw(id);
      return mapper.mapPurchaseRequestToDomain(raw);
    }, `TunnelPurchaseRequests.fetchPurchaseRequest:${id}`);
  },

  async fetchPurchaseRequestsByIntervention(interventionId: string) {
    return apiCall(async () => {
      const raw = await datasource.fetchPurchaseRequestsByInterventionRaw(interventionId);
      return raw.map(mapper.mapPurchaseRequestToDomain).filter(Boolean);
    }, `TunnelPurchaseRequests.fetchByIntervention:${interventionId}`);
  },

  async createPurchaseRequest(payload: any) {
    return apiCall(async () => {
      const backendPayload = mapper.mapPurchaseRequestPayloadToBackend(payload);
      const raw = await datasource.createPurchaseRequestRaw(backendPayload);
      return mapper.mapPurchaseRequestToDomain(raw);
    }, 'TunnelPurchaseRequests.createPurchaseRequest');
  },

  async updatePurchaseRequest(id: string, payload: any) {
    return apiCall(async () => {
      const backendPayload = mapper.mapPurchaseRequestPayloadToBackend(payload);
      const raw = await datasource.updatePurchaseRequestRaw(id, backendPayload);
      return mapper.mapPurchaseRequestToDomain(raw);
    }, `TunnelPurchaseRequests.updatePurchaseRequest:${id}`);
  },

  async deletePurchaseRequest(id: string) {
    return apiCall(async () => {
      await datasource.deletePurchaseRequestRaw(id);
    }, `TunnelPurchaseRequests.deletePurchaseRequest:${id}`);
  },
};
