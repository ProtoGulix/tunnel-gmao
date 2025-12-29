/**
 * Intervention Status Logs Adapter
 *
 * Domain interface for intervention status logs.
 * Orchestrates datasource + mapper, exposes backend-agnostic API.
 *
 * @module adapters/directus/interventionStatusLogs/adapter
 */

import { apiCall } from '@/lib/api/errors';
import { invalidateCache } from '@/lib/api/client';
import {
  fetchStatusLogsFromBackend,
  fetchAllStatusLogsFromBackend,
  createStatusLogInBackend,
  fetchStatusLogsByTechnicianFromBackend,
} from './datasource';
import {
  mapStatusLogToDomain,
  mapStatusLogWithInterventionToDomain,
  mapStatusLogDomainToBackend,
} from './mapper';

/**
 * Intervention Status Logs Adapter
 *
 * Exposes domain methods following API_CONTRACTS.md.
 * All functions return pure domain DTOs.
 */
export const interventionStatusLogsAdapter = {
  /**
   * Fetch status change history for an intervention.
   *
   * @param {string} interventionId - Intervention ID
   * @returns {Promise<InterventionStatusLog[]>} Domain DTOs
   */
  fetchInterventionStatusLog: async (interventionId: string) => {
    return apiCall(async () => {
      const backendData = await fetchStatusLogsFromBackend(interventionId);
      return backendData.map(mapStatusLogToDomain);
    }, 'FetchInterventionStatusLog');
  },

  /**
   * Fetch all status logs.
   *
   * @returns {Promise<InterventionStatusLog[]>} Domain DTOs with intervention details
   */
  fetchAllStatusLogs: async () => {
    return apiCall(async () => {
      const backendData = await fetchAllStatusLogsFromBackend();
      return backendData.map(mapStatusLogWithInterventionToDomain);
    }, 'FetchAllStatusLogs');
  },

  /**
   * Create a status log entry.
   *
   * @param {Object} payload - Domain payload
   * @param {string} payload.interventionId - Intervention ID
   * @param {Object} [payload.from] - Previous status
   * @param {Object} [payload.to] - New status
   * @param {Object} [payload.technician] - Technician who made the change
   * @param {string} [payload.date] - Log date (defaults to now)
   * @returns {Promise<InterventionStatusLog>} Domain DTO
   */
  createStatusLog: async (payload: {
    interventionId: string;
    from?: { id: string };
    to?: { id: string };
    technician?: { id: string };
    date?: string;
  }) => {
    return apiCall(async () => {
      const backendPayload = mapStatusLogDomainToBackend(payload);
      const backendData = await createStatusLogInBackend(backendPayload);

      // Invalidate logical cache tags
      invalidateCache(`interventions:${payload.interventionId}`);
      invalidateCache('statusLogs');

      return mapStatusLogToDomain(backendData);
    }, 'CreateStatusLog');
  },

  /**
   * Fetch status logs by technician.
   *
   * @param {string} technicianId - Technician ID
   * @returns {Promise<InterventionStatusLog[]>} Domain DTOs with intervention details
   */
  fetchStatusLogsByTechnician: async (technicianId: string) => {
    return apiCall(async () => {
      const backendData = await fetchStatusLogsByTechnicianFromBackend(technicianId);
      return backendData.map(mapStatusLogWithInterventionToDomain);
    }, 'FetchStatusLogsByTechnician');
  },
};
