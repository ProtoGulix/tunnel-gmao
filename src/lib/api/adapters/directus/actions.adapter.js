/**
 * Actions Adapter (Directus)
 *
 * Maps Directus-specific responses to domain DTOs defined in API_CONTRACTS.md:
 * - InterventionAction
 *
 * Handles:
 * - Directus field name mappings (e.g., tech → technician, time_spent → timeSpent)
 * - Directus-specific filters and query parameters
 * - Response normalization to domain shapes
 * - Cache invalidation
 */

import { api, invalidateCache } from '@/lib/api/client';
import { apiCall } from '@/lib/api/errors';

// ============================================================================
// Response Mappers (Directus → Domain)
// ============================================================================

/**
 * Maps a Directus intervention action response to domain InterventionAction DTO.
 *
 * Field mappings:
 * - tech → technician (nested object)
 * - time_spent → timeSpent
 * - complexity_score → complexityScore
 * - created_at → createdAt
 * - action_subcategory → subcategory
 * - intervention_id → intervention
 *
 * @param {Object} item - Raw Directus response item
 * @returns {Object|null} Domain InterventionAction DTO or null if input is null
 */
const mapActionToDomain = (item) => {
  if (!item) return null;

  return {
    id: item.id,
    description: item.description,
    timeSpent: item.time_spent,
    complexityScore: item.complexity_score,
    createdAt: item.created_at,
    technician: item.tech
      ? {
          id: item.tech.id,
          firstName: item.tech.first_name,
          lastName: item.tech.last_name,
        }
      : undefined,
    subcategory: item.action_subcategory
      ? {
          id: item.action_subcategory.id,
          code: item.action_subcategory.code,
          name: item.action_subcategory.name,
          category_id: item.action_subcategory.category_id
            ? {
                code: item.action_subcategory.category_id.code,
                name: item.action_subcategory.category_id.name,
              }
            : undefined,
        }
      : undefined,
    intervention: item.intervention_id
      ? {
          id: item.intervention_id.id,
          code: item.intervention_id.code,
          title: item.intervention_id.title,
        }
      : undefined,
  };
};

// ============================================================================
// Payload Mappers (Domain → Directus)
// ============================================================================

/**
 * Maps domain InterventionAction payload to Directus format.
 *
 * Selective field mapping (only defined fields are included).
 * Converts camelCase domain names to snake_case Directus names.
 *
 * @param {Object} payload - Domain InterventionAction payload
 * @param {string} [payload.description] - Action description
 * @param {number} [payload.timeSpent] - Time spent in minutes
 * @param {number} [payload.complexityScore] - Complexity score (0-10)
 * @param {Object} [payload.subcategory] - Subcategory reference { id: string }
 * @param {Object} [payload.technician] - Technician reference { id: string }
 * @param {Object} [payload.intervention] - Intervention reference { id: string }
 * @returns {Object} Directus-compatible payload
 */
const mapActionPayloadToBackend = (payload) => {
  const backend = {};
  if (payload.description !== undefined) backend.description = payload.description;
  if (payload.timeSpent !== undefined) backend.time_spent = payload.timeSpent;
  if (payload.complexityScore !== undefined) backend.complexity_score = payload.complexityScore;
  if (payload.subcategory?.id !== undefined) backend.action_subcategory = payload.subcategory.id;
  if (payload.technician?.id !== undefined) backend.tech = payload.technician.id;
  if (payload.intervention?.id !== undefined) backend.intervention_id = payload.intervention.id;
  return backend;
};

// ============================================================================
// API Methods (Domain interface)
// ============================================================================

export const actionsAdapter = {
  /**
   * Fetch all actions across interventions.
   * @returns {Promise<InterventionAction[]>}
   */
  fetchActions: async () => {
    return apiCall(async () => {
      const { data } = await api.get('/items/intervention_action', {
        params: {
          limit: -1,
          sort: '-created_at',
          fields: [
            'id',
            'description',
            'time_spent',
            'complexity_score',
            'created_at',
            'tech.id',
            'tech.first_name',
            'tech.last_name',
            'action_subcategory.id',
            'action_subcategory.name',
            'action_subcategory.code',
            'action_subcategory.category_id.code',
            'action_subcategory.category_id.name',
            'intervention_id.id',
            'intervention_id.code',
            'intervention_id.title',
          ].join(','),
          _t: Date.now(),
        },
      });
      return data.data.map(mapActionToDomain);
    }, 'FetchActions');
  },

  /**
   * Fetch actions for a specific intervention.
   * @param {string} interventionId - Intervention ID
   * @returns {Promise<InterventionAction[]>}
   */
  fetchActionsByIntervention: async (interventionId) => {
    return apiCall(async () => {
      const { data } = await api.get('/items/intervention_action', {
        params: {
          filter: {
            intervention_id: { _eq: interventionId },
          },
          limit: -1,
          sort: '-created_at',
          fields: [
            'id',
            'description',
            'time_spent',
            'complexity_score',
            'created_at',
            'tech.id',
            'tech.first_name',
            'tech.last_name',
            'action_subcategory.id',
            'action_subcategory.name',
            'action_subcategory.code',
            'action_subcategory.category_id.code',
            'action_subcategory.category_id.name',
          ].join(','),
          _t: Date.now(),
        },
      });
      return data.data.map(mapActionToDomain);
    }, 'FetchActionsByIntervention');
  },

  /**
   * Create an action for an intervention.
   * @param {Object} payload - Domain InterventionAction payload
   * @returns {Promise<InterventionAction>}
   */
  createAction: async (payload) => {
    return apiCall(async () => {
      const backendPayload = mapActionPayloadToBackend(payload);
      const response = await api.post('/items/intervention_action', backendPayload);

      // Invalidate related caches
      invalidateCache('actions');
      if (payload.intervention?.id) {
        invalidateCache(`interventions:${payload.intervention.id}`);
      }

      return mapActionToDomain(response.data.data);
    }, 'CreateAction');
  },

  /**
   * Update an action.
   * @param {string} actionId - Action ID
   * @param {Object} updates - Partial domain InterventionAction payload
   * @returns {Promise<InterventionAction>}
   */
  updateAction: async (actionId, updates) => {
    return apiCall(async () => {
      const backendUpdates = mapActionPayloadToBackend(updates);
      const response = await api.patch(`/items/intervention_action/${actionId}`, backendUpdates);

      // Invalidate related caches
      invalidateCache('actions');
      if (updates.intervention?.id) {
        invalidateCache(`interventions:${updates.intervention.id}`);
      }

      return mapActionToDomain(response.data.data);
    }, 'UpdateAction');
  },

  /**
   * Delete an action.
   * @param {string} actionId - Action ID
   * @param {string} interventionId - Optional intervention ID for cache invalidation
   * @returns {Promise<void>}
   */
  deleteAction: async (actionId, interventionId) => {
    return apiCall(async () => {
      await api.delete(`/items/intervention_action/${actionId}`);

      // Invalidate related caches
      invalidateCache('actions');
      if (interventionId) {
        invalidateCache(`interventions:${interventionId}`);
      }
    }, 'DeleteAction');
  },
};
