/**
 * Intervention Status Log Adapter (Directus)
 *
 * Maps Directus-specific responses to domain DTOs defined in API_CONTRACTS.md:
 * - InterventionStatusLog
 *
 * Handles:
 * - Directus field name mappings
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
 * Maps a Directus status log response to domain InterventionStatusLog DTO.
 */
const mapStatusLogToDomain = (item) => {
  if (!item) return null;

  return {
    id: item.id,
    date:
      typeof item.date === 'string'
        ? item.date
        : item.date?.toISOString?.() || new Date(item.date).toISOString(),
    from: item.status_from
      ? {
          id: item.status_from.id,
          value: item.status_from.value,
        }
      : undefined,
    to: item.status_to
      ? {
          id: item.status_to.id,
          value: item.status_to.value,
        }
      : undefined,
    technician: item.technician_id
      ? {
          id: item.technician_id.id,
          firstName: item.technician_id.first_name,
          lastName: item.technician_id.last_name,
        }
      : undefined,
  };
};

// ============================================================================
// API Methods (Domain interface)
// ============================================================================

export const interventionStatusLogsAdapter = {
  /**
   * Fetch status change history for an intervention.
   * @param {string} interventionId - Intervention ID
   * @returns {Promise<InterventionStatusLog[]>}
   */
  fetchInterventionStatusLog: async (interventionId) => {
    return apiCall(async () => {
      const { data } = await api.get('/items/intervention_status_log', {
        params: {
          filter: { intervention_id: { _eq: interventionId } },
          sort: '-date',
          limit: -1,
          fields: [
            'id',
            'date',
            'status_from.id',
            'status_from.value',
            'status_to.id',
            'status_to.value',
            'technician_id.id',
            'technician_id.first_name',
            'technician_id.last_name',
          ].join(','),
          _t: Date.now(),
        },
      });
      return data.data.map(mapStatusLogToDomain);
    }, 'FetchInterventionStatusLog');
  },

  /**
   * Fetch all status logs.
   * @returns {Promise<InterventionStatusLog[]>}
   */
  fetchAllStatusLogs: async () => {
    return apiCall(async () => {
      const { data } = await api.get('/items/intervention_status_log', {
        params: {
          limit: -1,
          sort: '-date',
          fields: [
            'id',
            'date',
            'intervention_id.id',
            'intervention_id.code',
            'intervention_id.title',
            'status_from.id',
            'status_from.value',
            'status_to.id',
            'status_to.value',
            'technician_id.id',
            'technician_id.first_name',
            'technician_id.last_name',
          ].join(','),
          _t: Date.now(),
        },
      });
      return data.data.map((item) => ({
        ...mapStatusLogToDomain(item),
        intervention: item.intervention_id
          ? {
              id: item.intervention_id.id,
              code: item.intervention_id.code,
              title: item.intervention_id.title,
            }
          : undefined,
      }));
    }, 'FetchAllStatusLogs');
  },

  /**
   * Create a status log entry.
   * @param {Object} payload - Domain payload
   * @returns {Promise<InterventionStatusLog>}
   */
  createStatusLog: async (payload) => {
    return apiCall(async () => {
      const backendPayload = {
        intervention_id: payload.interventionId,
        status_from: payload.from?.id,
        status_to: payload.to?.id,
        technician_id: payload.technician?.id,
        date: payload.date || new Date().toISOString(),
      };

      const response = await api.post('/items/intervention_status_log', backendPayload);
      invalidateCache(`interventions:${payload.interventionId}`);
      invalidateCache('statusLogs');

      return mapStatusLogToDomain(response.data.data);
    }, 'CreateStatusLog');
  },

  /**
   * Fetch status logs by technician.
   * @param {string} technicianId - Technician ID
   * @returns {Promise<InterventionStatusLog[]>}
   */
  fetchStatusLogsByTechnician: async (technicianId) => {
    return apiCall(async () => {
      const { data } = await api.get('/items/intervention_status_log', {
        params: {
          filter: { technician_id: { _eq: technicianId } },
          sort: '-date',
          limit: -1,
          fields: [
            'id',
            'date',
            'intervention_id.id',
            'intervention_id.code',
            'status_from.id',
            'status_from.value',
            'status_to.id',
            'status_to.value',
          ].join(','),
          _t: Date.now(),
        },
      });
      return data.data.map((item) => ({
        ...mapStatusLogToDomain(item),
        intervention: item.intervention_id
          ? {
              id: item.intervention_id.id,
              code: item.intervention_id.code,
            }
          : undefined,
      }));
    }, 'FetchStatusLogsByTechnician');
  },
};
