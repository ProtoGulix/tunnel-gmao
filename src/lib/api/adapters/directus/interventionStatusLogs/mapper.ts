/**
 * Intervention Status Logs Mapper (Directus → Domain)
 *
 * Maps backend responses to domain DTOs (API_CONTRACTS.md).
 * No backend calls, no HTTP, pure transformation.
 *
 * @module adapters/directus/interventionStatusLogs/mapper
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// Mapper functions handle untyped backend data - type safety enforced at adapter boundary

/**
 * Maps a Directus status log response to domain InterventionStatusLog DTO.
 *
 * Domain shape (API_CONTRACTS.md):
 * - id: string
 * - date: string
 * - from?: { id: string, value?: string }
 * - to?: { id: string, value?: string }
 * - technician?: { id: string, firstName: string, lastName: string }
 *
 * @param {any} item - Raw Directus response
 * @returns {InterventionStatusLog} Domain DTO
 */
export function mapStatusLogToDomain(item: any): any {
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
}

/**
 * Maps a Directus status log with intervention details to domain DTO.
 *
 * Extends base mapping with:
 * - intervention?: { id: string, code?: string, title?: string }
 *
 * @param {any} item - Raw Directus response
 * @returns {InterventionStatusLog} Domain DTO with intervention details
 */
export function mapStatusLogWithInterventionToDomain(item: any): any {
  const baseLog = mapStatusLogToDomain(item);

  return {
    ...baseLog,
    intervention: item.intervention_id
      ? {
          id: item.intervention_id.id,
          code: item.intervention_id.code,
          title: item.intervention_id.title,
        }
      : undefined,
  };
}

/**
 * Maps domain payload to Directus backend payload.
 *
 * Domain input:
 * - interventionId: string
 * - from?: { id: string }
 * - to?: { id: string }
 * - technician?: { id: string }
 * - date?: string
 *
 * Backend output:
 * - intervention_id: string
 * - status_from?: string
 * - status_to?: string
 * - technician_id?: string
 * - date: string
 *
 * @param {Object} payload - Domain payload
 * @returns {Object} Directus payload
 */
export function mapStatusLogDomainToBackend(payload: {
  interventionId: string;
  from?: { id: string };
  to?: { id: string };
  technician?: { id: string };
  date?: string;
}): {
  intervention_id: string;
  status_from?: string;
  status_to?: string;
  technician_id?: string;
  date: string;
} {
  return {
    intervention_id: payload.interventionId,
    status_from: payload.from?.id,
    status_to: payload.to?.id,
    technician_id: payload.technician?.id,
    date: payload.date || new Date().toISOString(),
  };
}
