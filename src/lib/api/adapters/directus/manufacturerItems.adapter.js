import { api } from '@/lib/api/client';
import { apiCall } from '@/lib/api/errors';

// ============================================================================
// Response Mapper (Backend → Domain DTO)
// ============================================================================

/**
 * Maps a Directus manufacturer item to domain ManufacturerItem DTO.
 *
 * Field mappings:
 * - manufacturer_name → manufacturerName
 * - manufacturer_ref → manufacturerRef
 * - designation → designation (unchanged)
 *
 * @param {Object} item - Raw Directus response item
 * @returns {Object|null} Domain ManufacturerItem DTO or null if input is null
 */
const mapManufacturerItemToDomain = (item) => {
  if (!item) return null;
  return {
    id: item.id,
    manufacturerName: item.manufacturer_name || undefined,
    manufacturerRef: item.manufacturer_ref || undefined,
    designation: item.designation || undefined,
  };
};

// ============================================================================
// Payload Mapper (Domain → Backend)
// ============================================================================

/**
 * Maps domain ManufacturerItem payload to Directus format.
 *
 * Selective field mapping (only defined fields are included).
 * Converts camelCase domain names to snake_case Directus names.
 *
 * @param {Object} payload - Domain ManufacturerItem payload
 * @param {string} [payload.manufacturerName] - Manufacturer name
 * @param {string} [payload.manufacturerRef] - Manufacturer reference/part number
 * @param {string} [payload.designation] - Product designation
 * @returns {Object} Directus-compatible payload
 */
const mapManufacturerItemDomainToBackend = (payload) => {
  const backend = {};
  if (payload.manufacturerName !== undefined)
    backend.manufacturer_name = payload.manufacturerName || null;
  if (payload.manufacturerRef !== undefined)
    backend.manufacturer_ref = payload.manufacturerRef || null;
  if (payload.designation !== undefined) backend.designation = payload.designation || null;
  // Support legacy field names
  if (payload.name !== undefined) backend.manufacturer_name = payload.name || null;
  if (payload.ref !== undefined) backend.manufacturer_ref = payload.ref || null;
  return backend;
};

// ============================================================================
// API Methods
// ============================================================================

const fetchManufacturerItems = async () => {
  return apiCall(async () => {
    const { data } = await api.get('/items/manufacturer_item', {
      params: {
        limit: -1,
        sort: ['manufacturer_name', 'manufacturer_ref'].join(','),
        fields: ['id', 'manufacturer_name', 'manufacturer_ref', 'designation'].join(','),
        _t: Date.now(),
      },
    });
    const items = data?.data || [];
    return items.map(mapManufacturerItemToDomain);
  }, 'FetchManufacturerItems');
};

const findManufacturerItem = async ({ name, ref, manufacturerName, manufacturerRef }) => {
  // Support both legacy and new field names
  const searchName = manufacturerName || name;
  const searchRef = manufacturerRef || ref;

  const filters = [];
  if (searchName) filters.push({ manufacturer_name: { _eq: searchName } });
  if (searchRef) filters.push({ manufacturer_ref: { _eq: searchRef } });
  if (filters.length === 0) return null;

  // Si les deux champs sont fournis, chercher avec AND (correspondance exacte)
  // Sinon, chercher avec OR (tolérant)
  const searchFilter = filters.length === 2 ? { _and: filters } : filters[0];

  return apiCall(async () => {
    const { data } = await api.get('/items/manufacturer_item', {
      params: {
        filter: searchFilter,
        limit: 1,
        fields: ['id', 'manufacturer_name', 'manufacturer_ref', 'designation'].join(','),
        _t: Date.now(),
      },
    });
    const item = data?.data && data.data[0];
    return mapManufacturerItemToDomain(item);
  }, 'FindManufacturerItem');
};

const createManufacturerItem = async (payload) => {
  return apiCall(async () => {
    const backendPayload = mapManufacturerItemDomainToBackend(payload);
    const { data } = await api.post('/items/manufacturer_item', backendPayload);
    return mapManufacturerItemToDomain(data?.data);
  }, 'CreateManufacturerItem');
};

const getOrCreateManufacturerItem = async (payload) => {
  // Support both legacy and new field names
  const name = payload.manufacturerName || payload.name;
  const ref = payload.manufacturerRef || payload.ref;

  if (!name && !ref) return null;
  const existing = await findManufacturerItem({ manufacturerName: name, manufacturerRef: ref });
  if (existing) return existing;
  return createManufacturerItem(payload);
};

// ============================================================================
// Export adapter
// ============================================================================

export const manufacturerItemsAdapter = {
  fetchManufacturerItems,
  findManufacturerItem,
  createManufacturerItem,
  getOrCreateManufacturerItem,
};
