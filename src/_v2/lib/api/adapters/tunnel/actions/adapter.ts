/**
 * Actions Adapter - Tunnel Backend
 *
 * Backend-agnostic domain interface. Orchestrates datasource + mapper.
 *
 * @module lib/api/adapters/tunnel/actions/adapter
 */

import { apiCall } from '@/lib/api/errors';
import * as datasource from './datasource';
import * as mapper from './mapper';

export const actionsAdapter = {
  async fetchActions(interventionId?: string) {
    return apiCall(async () => {
      const raw = await datasource.fetchActionsRaw(interventionId);
      return raw.map(mapper.mapActionToDomain).filter(Boolean);
    }, interventionId ? `TunnelActions.fetchActions:${interventionId}` : 'TunnelActions.fetchActions');
  },

  /**
   * Create a new intervention action.
   *
   * @param payload - Domain InterventionAction payload
   * @returns Created InterventionAction DTO
   */
  async createAction(payload: any) {
    return apiCall(async () => {
      // 1. Map domain payload to backend format
      const backendPayload = mapper.mapActionPayloadToBackend(payload);

      // 2. Create in backend
      const rawAction = await datasource.createActionRaw(backendPayload);

      // 3. Map response to domain DTO
      return mapper.mapActionToDomain(rawAction);
    }, 'TunnelActions.createAction');
  },

  updateAction: undefined,
  deleteAction: undefined,
};
