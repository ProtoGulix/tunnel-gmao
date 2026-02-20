/**
 * Preventive Mapper (Directus → Domain DTOs)
 * Pure mapping logic. No backend calls, no domain logic, no cache.
 */

/**
 * Map preventive suggestion from backend to domain
 * @param {Object} item - Raw backend item
 * @returns {Object|null} Domain DTO
 */
export const mapPreventiveSuggestionToDomain = (item) => {
  if (!item) return null;

  return {
    id: item.id,
    machineId: item.machine_id,
    preventiveCode: item.preventive_code,
    preventiveLabel: item.preventive_label,
    score: item.score ?? 0,
    status: item.status ?? 'NEW',
    detectedAt: item.detected_at,
    handledAt: item.handled_at ?? undefined,
    handledBy: item.handled_by ?? undefined,
    interventionActionId: item.intervention_action_id ?? undefined,
    machine:
      typeof item.machine_id === 'object' && item.machine_id !== null
        ? {
            id: item.machine_id.id,
            code: item.machine_id.code ?? undefined,
            name: item.machine_id.name ?? undefined,
          }
        : undefined,
  };
};

/**
 * Map domain updates to backend payload
 * @param {Object} domainUpdates - Domain DTO
 * @returns {Object} Backend payload
 */
export const mapPreventiveSuggestionDomainToBackend = (domainUpdates) => {
  const backendPayload = {};

  if (domainUpdates.status !== undefined) backendPayload.status = domainUpdates.status;
  if (domainUpdates.handledAt !== undefined) backendPayload.handled_at = domainUpdates.handledAt;
  if (domainUpdates.handledBy !== undefined) backendPayload.handled_by = domainUpdates.handledBy;

  return backendPayload;
};
