/**
 * Preventive Datasource (Directus)
 * Backend calls only. No mapping, no DTOs, no domain logic.
 * All backend-specific fields and filters must stay here.
 */

import { api } from '@/lib/api/client';
import { apiCall } from '@/lib/api/errors';

/**
 * Fetch all preventive suggestions (raw backend)
 * @param {string} status - Status filter
 * @returns {Promise<Array>}
 */
export const fetchAllPreventiveSuggestionsRaw = async (status) => {
  return apiCall(async () => {
    const { data } = await api.get('/items/preventive_suggestion', {
      params: {
        'filter[status][_eq]': status,
        sort: '-detected_at',
        limit: 500,
        fields: '*,machine_id.*',
        _t: Date.now(),
      },
    });
    return data?.data || [];
  }, 'FetchAllPreventiveSuggestions');
};

/**
 * Fetch preventive suggestions for a specific machine (raw backend)
 * @param {string} machineId - Machine UUID
 * @param {string} status - Status filter
 * @returns {Promise<Array>}
 */
export const fetchPreventiveSuggestionsRaw = async (machineId, status) => {
  return apiCall(async () => {
    const { data } = await api.get('/items/preventive_suggestion', {
      params: {
        'filter[machine_id][_eq]': machineId,
        'filter[status][_eq]': status,
        sort: '-detected_at',
        limit: 100,
        _t: Date.now(),
      },
    });
    return data?.data || [];
  }, 'FetchPreventiveSuggestions');
};

/**
 * Update preventive suggestion status (raw backend)
 * @param {string} suggestionId - Suggestion UUID
 * @param {Object} backendUpdates - Backend payload
 * @returns {Promise<Object>}
 */
export const updatePreventiveSuggestionRaw = async (suggestionId, backendUpdates) => {
  return apiCall(async () => {
    const { data } = await api.patch(
      `/items/preventive_suggestion/${suggestionId}`,
      backendUpdates
    );
    return data?.data;
  }, 'UpdatePreventiveSuggestion');
};
