/**
 * Intervention Status References Adapter
 *
 * Domain interface for intervention status references.
 * Orchestrates datasource + mapper, exposes backend-agnostic API.
 *
 * @module adapters/directus/interventionStatusRefs/adapter
 */

import { apiCall } from '@/lib/api/errors';
import {
  fetchAllStatusesFromBackend,
  fetchStatusByIdFromBackend,
  fetchStatusByValueFromBackend,
} from './datasource';
import { mapStatusToDomain } from './mapper';

/**
 * Intervention Status References Adapter
 *
 * Exposes domain methods following API_CONTRACTS.md.
 * All functions return pure domain DTOs.
 */
export const interventionStatusRefsAdapter = {
  /**
   * Fetch all intervention status references.
   *
   * @returns {Promise<InterventionStatus[]>} Domain DTOs
   */
  fetchInterventionStatuses: async () => {
    return apiCall(async () => {
      const backendData = await fetchAllStatusesFromBackend();
      return backendData.map(mapStatusToDomain);
    }, 'FetchInterventionStatuses');
  },

  /**
   * Fetch a single intervention status by ID.
   *
   * @param {string} id - Status ID
   * @returns {Promise<InterventionStatus>} Domain DTO
   */
  fetchInterventionStatus: async (id: string) => {
    return apiCall(async () => {
      const backendData = await fetchStatusByIdFromBackend(id);
      return mapStatusToDomain(backendData);
    }, 'FetchInterventionStatus');
  },

  /**
   * Fetch intervention status by value.
   *
   * @param {string} value - Status value (e.g., 'open', 'in_progress')
   * @returns {Promise<InterventionStatus|null>} Domain DTO or null if not found
   */
  fetchInterventionStatusByValue: async (value: string) => {
    return apiCall(async () => {
      const backendData = await fetchStatusByValueFromBackend(value);
      return backendData ? mapStatusToDomain(backendData) : null;
    }, 'FetchInterventionStatusByValue');
  },
};
