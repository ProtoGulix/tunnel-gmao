/**
 * Actions Adapter - Domain Interface
 * 
 * Orchestrates datasource and mapper to provide clean domain API.
 * No backend details, no HTTP, no filters - pure domain orchestration.
 * 
 * Rules:
 * - NO backend calls (datasource handles that)
 * - NO DTO mapping (mapper handles that)
 * - Orchestration only: datasource → mapper → return
 * - Use apiCall for error handling
 * - Use logical cache tags
 * 
 * @module lib/api/adapters/directus/actions/adapter
 */

import { apiCall } from '@/lib/api/errors';
import { invalidateCache } from '@/lib/api/client';
import { 
  fetchActionsRaw, 
  fetchActionsByInterventionRaw,
  createActionRaw,
  updateActionRaw,
  deleteActionRaw
} from './datasource';
import { mapActionToDomain, mapActionPayloadToBackend } from './mapper';
import type { ActionsNamespace } from '@/lib/api/adapters/ApiAdapter';

/**
 * Actions adapter implementing ActionsNamespace interface
 */
export const actionsAdapter: ActionsNamespace = {
  /**
   * Fetch all actions (optionally filtered by intervention)
   * 
   * @param interventionId - Optional intervention ID to filter by
   * @returns Array of domain InterventionAction DTOs
   */
  async fetchActions(interventionId?: string) {
    return apiCall(async () => {
      // 1. Get raw data from backend
      const rawActions = interventionId 
        ? await fetchActionsByInterventionRaw(interventionId)
        : await fetchActionsRaw();
      
      // 2. Map to domain DTOs
      return rawActions.map(mapActionToDomain);
    }, 'Actions.fetchActions');
  },

  /**
   * Create an action
   * 
   * @param payload - Domain InterventionAction payload
   * @returns Created InterventionAction DTO
   */
  async createAction(payload) {
    return apiCall(async () => {
      // 1. Map domain payload to backend format
      const backendPayload = mapActionPayloadToBackend(payload);
      
      // 2. Create in backend
      const rawAction = await createActionRaw(backendPayload);
      
      // 3. Invalidate related caches
      invalidateCache('actions');
      if (payload.intervention?.id) {
        invalidateCache(`interventions:${payload.intervention.id}`);
      }
      
      // 4. Map response to domain DTO
      return mapActionToDomain(rawAction);
    }, 'Actions.createAction');
  },

  /**
   * Update an action
   * 
   * @param actionId - Action ID
   * @param updates - Partial domain InterventionAction payload
   * @returns Updated InterventionAction DTO
   */
  async updateAction(actionId: string, updates) {
    return apiCall(async () => {
      // 1. Map domain updates to backend format
      const backendUpdates = mapActionPayloadToBackend(updates);
      
      // 2. Update in backend
      const rawAction = await updateActionRaw(actionId, backendUpdates);
      
      // 3. Invalidate related caches
      invalidateCache('actions');
      if (updates.intervention?.id) {
        invalidateCache(`interventions:${updates.intervention.id}`);
      }
      
      // 4. Map response to domain DTO
      return mapActionToDomain(rawAction);
    }, 'Actions.updateAction');
  },

  /**
   * Delete an action
   * 
   * @param actionId - Action ID
   * @param interventionId - Optional intervention ID for cache invalidation
   * @returns void
   */
  async deleteAction(actionId: string, interventionId?: string) {
    return apiCall(async () => {
      // 1. Delete from backend
      await deleteActionRaw(actionId);
      
      // 2. Invalidate related caches
      invalidateCache('actions');
      if (interventionId) {
        invalidateCache(`interventions:${interventionId}`);
      }
    }, 'Actions.deleteAction');
  },
};
