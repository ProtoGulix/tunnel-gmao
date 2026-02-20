/**
 * Intervention Status References Datasource (Directus)
 *
 * Raw backend calls only. No DTO mapping.
 * Returns Directus-specific response shapes.
 *
 * @module adapters/directus/interventionStatusRefs/datasource
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// Datasource handles raw backend payloads - type safety enforced at adapter boundary

import { api } from '@/lib/api/client';

/**
 * Fetch all intervention statuses from Directus.
 * @returns {Promise<any[]>} Raw Directus response
 */
export async function fetchAllStatusesFromBackend(): Promise<any[]> {
  const { data } = await api.get('/items/intervention_status', {
    params: {
      limit: -1,
      sort: 'order',
      fields: ['id', 'value', 'label', 'color', 'order'].join(','),
      _t: Date.now(),
    },
  });
  return data.data;
}

/**
 * Fetch a single intervention status by ID from Directus.
 * @param {string} id - Status ID
 * @returns {Promise<any>} Raw Directus response
 */
export async function fetchStatusByIdFromBackend(id: string): Promise<any> {
  const { data } = await api.get(`/items/intervention_status/${id}`, {
    params: {
      fields: ['id', 'value', 'label', 'color', 'order'].join(','),
      _t: Date.now(),
    },
  });
  return data.data;
}

/**
 * Fetch intervention status by value from Directus.
 * @param {string} value - Status value (e.g., 'open', 'in_progress')
 * @returns {Promise<any>} Raw Directus response or null
 */
export async function fetchStatusByValueFromBackend(value: string): Promise<any> {
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
  return data.data.length > 0 ? data.data[0] : null;
}
