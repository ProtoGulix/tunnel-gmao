/**
 * Manufacturer Items Datasource (Directus)
 *
 * Raw backend calls only. No DTO mapping.
 * Returns Directus-specific response shapes.
 *
 * @module adapters/directus/manufacturerItems/datasource
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// Datasource handles raw backend payloads - type safety enforced at adapter boundary

import { api } from '@/lib/api/client';

/**
 * Fetch all manufacturer items from Directus.
 * @returns {Promise<any[]>} Raw Directus response
 */
export async function fetchAllManufacturerItemsFromBackend(): Promise<any[]> {
  const { data } = await api.get('/items/manufacturer_item', {
    params: {
      limit: -1,
      sort: ['manufacturer_name', 'manufacturer_ref'].join(','),
      fields: ['id', 'manufacturer_name', 'manufacturer_ref', 'designation'].join(','),
      _t: Date.now(),
    },
  });
  return data?.data || [];
}

/**
 * Search for manufacturer items by name and/or ref.
 * @param {Object} filters - Search filters
 * @param {string} [filters.manufacturerName] - Manufacturer name to search
 * @param {string} [filters.manufacturerRef] - Manufacturer ref to search
 * @returns {Promise<any|null>} Raw Directus response or null
 */
export async function fetchManufacturerItemBySearchFromBackend(filters: {
  manufacturerName?: string;
  manufacturerRef?: string;
}): Promise<any> {
  const searchFilters = [];
  if (filters.manufacturerName) {
    searchFilters.push({ manufacturer_name: { _eq: filters.manufacturerName } });
  }
  if (filters.manufacturerRef) {
    searchFilters.push({ manufacturer_ref: { _eq: filters.manufacturerRef } });
  }

  if (searchFilters.length === 0) return null;

  // Use AND for exact match when both provided, OR otherwise
  const searchFilter =
    searchFilters.length === 2 ? { _and: searchFilters } : searchFilters[0];

  const { data } = await api.get('/items/manufacturer_item', {
    params: {
      filter: searchFilter,
      limit: 1,
      fields: ['id', 'manufacturer_name', 'manufacturer_ref', 'designation'].join(','),
      _t: Date.now(),
    },
  });
  return data?.data && data.data[0] ? data.data[0] : null;
}

/**
 * Create a manufacturer item in Directus.
 * @param {Object} backendPayload - Directus-specific payload
 * @returns {Promise<any>} Raw Directus response
 */
export async function createManufacturerItemInBackend(backendPayload: {
  manufacturer_name?: string | null;
  manufacturer_ref?: string | null;
  designation?: string | null;
}): Promise<any> {
  const { data } = await api.post('/items/manufacturer_item', backendPayload);
  return data?.data;
}
