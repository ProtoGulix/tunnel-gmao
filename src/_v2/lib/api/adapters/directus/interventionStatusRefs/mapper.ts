/**
 * Intervention Status References Mapper (Directus → Domain)
 *
 * Maps backend responses to domain DTOs.
 * No backend calls, no HTTP, pure transformation.
 *
 * @module adapters/directus/interventionStatusRefs/mapper
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// Mapper functions handle untyped backend data - type safety enforced at adapter boundary

/**
 * Maps a Directus intervention_status response to domain InterventionStatus DTO.
 *
 * Domain shape:
 * - id: string
 * - value: string
 * - label?: string
 * - color?: string
 * - order?: number
 *
 * @param {any} item - Raw Directus response
 * @returns {InterventionStatus} Domain DTO
 */
export function mapStatusToDomain(item: any): any {
  if (!item) return null;

  return {
    id: item.id,
    value: item.value,
    label: item.label,
    color: item.color,
    order: item.order,
  };
}
