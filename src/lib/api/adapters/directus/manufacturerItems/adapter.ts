/**
 * Manufacturer Items Adapter
 *
 * Domain interface for manufacturer items.
 * Orchestrates datasource + mapper, exposes backend-agnostic API.
 *
 * @module adapters/directus/manufacturerItems/adapter
 */

import { apiCall } from '@/lib/api/errors';
import {
  fetchAllManufacturerItemsFromBackend,
  fetchManufacturerItemBySearchFromBackend,
  createManufacturerItemInBackend,
} from './datasource';
import {
  mapManufacturerItemToDomain,
  mapManufacturerItemDomainToBackend,
} from './mapper';

/**
 * Manufacturer Items Adapter
 *
 * Exposes domain methods following API_CONTRACTS.md.
 * All functions return pure domain DTOs.
 */
export const manufacturerItemsAdapter = {
  /**
   * Fetch all manufacturer items.
   *
   * @returns {Promise<ManufacturerItem[]>} Domain DTOs
   */
  fetchManufacturerItems: async () => {
    return apiCall(async () => {
      const backendData = await fetchAllManufacturerItemsFromBackend();
      return backendData.map(mapManufacturerItemToDomain);
    }, 'FetchManufacturerItems');
  },

  /**
   * Find a manufacturer item by name and/or reference.
   *
   * Supports both new and legacy field names for backward compatibility.
   *
   * @param {Object} payload - Search criteria
   * @param {string} [payload.name] - Legacy field name for manufacturer name
   * @param {string} [payload.ref] - Legacy field name for manufacturer ref
   * @param {string} [payload.manufacturerName] - Manufacturer name
   * @param {string} [payload.manufacturerRef] - Manufacturer reference
   * @returns {Promise<ManufacturerItem|null>} Domain DTO or null if not found
   */
  findManufacturerItem: async (payload: {
    name?: string;
    ref?: string;
    manufacturerName?: string;
    manufacturerRef?: string;
  }) => {
    return apiCall(async () => {
      // Support both legacy and new field names
      const searchName = payload.manufacturerName || payload.name;
      const searchRef = payload.manufacturerRef || payload.ref;

      if (!searchName && !searchRef) return null;

      const backendData = await fetchManufacturerItemBySearchFromBackend({
        manufacturerName: searchName,
        manufacturerRef: searchRef,
      });

      return backendData ? mapManufacturerItemToDomain(backendData) : null;
    }, 'FindManufacturerItem');
  },

  /**
   * Create a new manufacturer item.
   *
   * @param {Object} payload - Domain ManufacturerItem payload
   * @param {string} [payload.manufacturerName] - Manufacturer name
   * @param {string} [payload.manufacturerRef] - Manufacturer reference
   * @param {string} [payload.designation] - Product designation
   * @param {string} [payload.name] - Legacy field name for manufacturer name
   * @param {string} [payload.ref] - Legacy field name for manufacturer ref
   * @returns {Promise<ManufacturerItem>} Domain DTO
   */
  createManufacturerItem: async (payload: Record<string, unknown>) => {
    return apiCall(async () => {
      const backendPayload = mapManufacturerItemDomainToBackend(payload);
      const backendData = await createManufacturerItemInBackend(backendPayload);
      return mapManufacturerItemToDomain(backendData);
    }, 'CreateManufacturerItem');
  },

  /**
   * Get an existing manufacturer item or create it if it doesn't exist.
   *
   * Searches by manufacturerName and manufacturerRef, returns existing item if found,
   * otherwise creates a new one.
   *
   * @param {Object} payload - Domain ManufacturerItem payload
   * @param {string} [payload.manufacturerName] - Manufacturer name
   * @param {string} [payload.manufacturerRef] - Manufacturer reference
   * @param {string} [payload.designation] - Product designation
   * @param {string} [payload.name] - Legacy field name
   * @param {string} [payload.ref] - Legacy field name
   * @returns {Promise<ManufacturerItem|null>} Domain DTO or null if no search criteria
   */
  getOrCreateManufacturerItem: async (payload: Record<string, unknown>) => {
    // Support both legacy and new field names
    const name = payload.manufacturerName || payload.name;
    const ref = payload.manufacturerRef || payload.ref;

    if (!name && !ref) return null;

    // Search for existing item
    const existing = await manufacturerItemsAdapter.findManufacturerItem({
      manufacturerName: name as string,
      manufacturerRef: ref as string,
    });

    if (existing) return existing;

    // Create new item if not found
    return manufacturerItemsAdapter.createManufacturerItem(payload);
  },
};
