/**
 * Intervention Status References Adapter (Directus)
 *
 * Maps Directus-specific responses to domain DTOs defined in API_CONTRACTS.md:
 * - InterventionStatus
 *
 * Handles:
 * - Directus field name mappings
 * - Response normalization to domain shapes
 * - Cache invalidation
 */

import { api } from '@/lib/api/client';
import { apiCall } from '@/lib/api/errors';

// ============================================================================
// Response Mappers (Directus → Domain)
// ============================================================================

/**
 * Maps a Directus intervention_status response to domain InterventionStatus DTO.
 */
const mapStatusToDomain = (item) => {
  if (!item) return null;

  return {
    id: item.id,
    value: item.value,
    label: item.label,
    color: item.color,
    order: item.order,
  };
};

// ============================================================================
// API Methods (Domain interface)
// ============================================================================

export const interventionStatusRefsAdapter = {
  /**
   * Fetch all intervention status references.
   * @returns {Promise<InterventionStatus[]>}
   */
  fetchInterventionStatuses: async () => {
    return apiCall(async () => {
      const { data } = await api.get('/items/intervention_status', {
        params: {
          limit: -1,
          sort: 'order',
          fields: ['id', 'value', 'label', 'color', 'order'].join(','),
          _t: Date.now(),
        },
      });
      return data.data.map(mapStatusToDomain);
    }, 'FetchInterventionStatuses');
  },

  /**
   * Fetch a single intervention status by ID.
   * @param {string} id - Status ID
   * @returns {Promise<InterventionStatus>}
   */
  fetchInterventionStatus: async (id) => {
    return apiCall(async () => {
      const { data } = await api.get(`/items/intervention_status/${id}`, {
        params: {
          fields: ['id', 'value', 'label', 'color', 'order'].join(','),
          _t: Date.now(),
        },
      });
      return mapStatusToDomain(data.data);
    }, 'FetchInterventionStatus');
  },

  /**
   * Fetch intervention status by value.
   * @param {string} value - Status value (e.g., 'open', 'in_progress')
   * @returns {Promise<InterventionStatus>}
   */
  fetchInterventionStatusByValue: async (value) => {
    return apiCall(async () => {
      const { data } = await api.get('/items/intervention_status', {
        params: {
          filter: {
            value: { _eq: value },
          },
          limit: 1,
          fields: ['id', 'value', 'label', 'color', 'order'].join(','),
          _t: Date.now(),
        },
      });
      return data.data.length > 0 ? mapStatusToDomain(data.data[0]) : null;
    }, 'FetchInterventionStatusByValue');
  },
};
