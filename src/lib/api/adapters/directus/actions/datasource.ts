/**
 * Actions Datasource - Pure Backend Calls
 * 
 * Handles all HTTP communication with backend for actions domain.
 * Returns raw backend responses without transformation.
 * 
 * Rules:
 * - Backend calls ONLY (HTTP, filters, fields)
 * - NO DTO mapping (mapper handles that)
 * - NO domain logic
 * - Return raw responses as-is
 * 
 * @module lib/api/adapters/directus/actions/datasource
 */

import { api } from '@/lib/api/client';

/**
 * Common fields for action queries
 */
const ACTION_FIELDS = [
  'id',
  'description',
  'time_spent',
  'complexity_score',
  'created_at',
  // complexity factor (O2M relation)
  'complexity_anotation',
  'tech.id',
  'tech.first_name',
  'tech.last_name',
  'action_subcategory.id',
  'action_subcategory.name',
  'action_subcategory.code',
  'action_subcategory.category_id.id',
  'action_subcategory.category_id.code',
  'action_subcategory.category_id.name',
  'action_subcategory.category_id.color',
  'intervention_id.id',
  'intervention_id.code',
  'intervention_id.title',
  'intervention_id.machine_id.id',
  'intervention_id.machine_id.name',
  'intervention_id.machine_id.code',
  'intervention_id.machine_id.is_mere',
  'intervention_id.machine_id.equipement_mere.id',
  'intervention_id.machine_id.equipement_mere.name',
  'intervention_id.machine_id.equipement_mere.code',
].join(',');

/**
 * Fetch all actions from backend
 * 
 * @returns Raw backend response
 */
export const fetchActionsRaw = async () => {
  const { data } = await api.get('/items/intervention_action', {
    params: {
      limit: -1,
      sort: '-created_at',
      fields: ACTION_FIELDS,
      _t: Date.now(),
    },
  });
  return data.data;
};

/**
 * Fetch actions for a specific intervention
 * 
 * @param interventionId - Intervention ID
 * @returns Raw backend response
 */
export const fetchActionsByInterventionRaw = async (interventionId: string) => {
  const { data } = await api.get('/items/intervention_action', {
    params: {
      filter: {
        intervention_id: { _eq: interventionId },
      },
      limit: -1,
      sort: '-created_at',
      fields: ACTION_FIELDS,
      _t: Date.now(),
    },
  });
  return data.data;
};

/**
 * Create action in backend
 * 
 * @param payload - Backend-formatted payload
 * @returns Raw backend response
 */
export const createActionRaw = async (payload: Record<string, unknown>) => {
  const response = await api.post('/items/intervention_action', payload);
  return response.data.data;
};

/**
 * Update action in backend
 * 
 * @param actionId - Action ID
 * @param updates - Backend-formatted updates
 * @returns Raw backend response
 */
export const updateActionRaw = async (actionId: string, updates: Record<string, unknown>) => {
  const response = await api.patch(
    `/items/intervention_action/${actionId}`,
    updates,
    {
      params: {
        fields: ACTION_FIELDS,
        _t: Date.now(),
      },
    }
  );
  return response.data.data;
};

/**
 * Delete action from backend
 * 
 * @param actionId - Action ID
 * @returns void
 */
export const deleteActionRaw = async (actionId: string): Promise<void> => {
  await api.delete(`/items/intervention_action/${actionId}`);
};
