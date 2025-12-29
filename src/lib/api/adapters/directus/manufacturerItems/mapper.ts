/**
 * Manufacturer Items Mapper (Directus → Domain)
 *
 * Maps backend responses to domain DTOs.
 * No backend calls, no HTTP, pure transformation.
 *
 * @module adapters/directus/manufacturerItems/mapper
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// Mapper functions handle untyped backend data - type safety enforced at adapter boundary

/**
 * Maps a Directus manufacturer_item response to domain ManufacturerItem DTO.
 *
 * Domain shape (API_CONTRACTS.md):
 * - id: string
 * - manufacturerName?: string
 * - manufacturerRef?: string
 * - designation?: string
 *
 * @param {any} item - Raw Directus response
 * @returns {ManufacturerItem|null} Domain DTO
 */
export function mapManufacturerItemToDomain(item: any): any {
  if (!item) return null;

  return {
    id: item.id,
    manufacturerName: item.manufacturer_name || undefined,
    manufacturerRef: item.manufacturer_ref || undefined,
    designation: item.designation || undefined,
  };
}

/**
 * Maps domain ManufacturerItem payload to Directus format.
 *
 * Converts camelCase domain names to snake_case Directus names.
 * Supports legacy field names (name, ref) for backward compatibility.
 *
 * Domain input:
 * - manufacturerName?: string
 * - manufacturerRef?: string
 * - designation?: string
 * (legacy: name, ref)
 *
 * Backend output:
 * - manufacturer_name?: string | null
 * - manufacturer_ref?: string | null
 * - designation?: string | null
 *
 * @param {Object} payload - Domain ManufacturerItem payload
 * @returns {Object} Directus-compatible payload
 */
export function mapManufacturerItemDomainToBackend(payload: any): {
  manufacturer_name?: string | null;
  manufacturer_ref?: string | null;
  designation?: string | null;
} {
  const backend: any = {};

  // Primary field names (new convention)
  if (payload.manufacturerName !== undefined) {
    backend.manufacturer_name = payload.manufacturerName || null;
  }
  if (payload.manufacturerRef !== undefined) {
    backend.manufacturer_ref = payload.manufacturerRef || null;
  }
  if (payload.designation !== undefined) {
    backend.designation = payload.designation || null;
  }

  // Legacy field names (backward compatibility)
  if (payload.name !== undefined) {
    backend.manufacturer_name = payload.name || null;
  }
  if (payload.ref !== undefined) {
    backend.manufacturer_ref = payload.ref || null;
  }

  return backend;
}
