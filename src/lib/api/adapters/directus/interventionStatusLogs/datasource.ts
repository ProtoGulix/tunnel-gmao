/**
 * Intervention Status Logs Datasource (Directus)
 *
 * Raw backend calls only. No DTO mapping.
 * Returns Directus-specific response shapes.
 *
 * @module adapters/directus/interventionStatusLogs/datasource
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// Datasource handles raw backend payloads - type safety enforced at adapter boundary

import { api } from '@/lib/api/client';

/**
 * Fetch status logs for a specific intervention from Directus.
 * @param {string} interventionId - Intervention ID
 * @returns {Promise<any[]>} Raw Directus response
 */
export async function fetchStatusLogsFromBackend(interventionId: string): Promise<any[]> {
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
  return data.data;
}

/**
 * Fetch all status logs from Directus.
 * @returns {Promise<any[]>} Raw Directus response
 */
export async function fetchAllStatusLogsFromBackend(): Promise<any[]> {
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
  return data.data;
}

/**
 * Create a status log entry in Directus.
 * @param {Object} backendPayload - Directus-specific payload
 * @returns {Promise<any>} Raw Directus response
 */
export async function createStatusLogInBackend(backendPayload: {
  intervention_id: string;
  status_from?: string;
  status_to?: string;
  technician_id?: string;
  date: string;
}): Promise<any> {
  const response = await api.post('/items/intervention_status_log', backendPayload);
  return response.data.data;
}

/**
 * Fetch status logs by technician from Directus.
 * @param {string} technicianId - Technician ID
 * @returns {Promise<any[]>} Raw Directus response
 */
export async function fetchStatusLogsByTechnicianFromBackend(
  technicianId: string
): Promise<any[]> {
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
  return data.data;
}
