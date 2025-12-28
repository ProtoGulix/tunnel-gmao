/**
 * Actions Mapper - Backend to Domain DTO Transformation
 * 
 * Transforms raw backend responses into clean domain DTOs.
 * Uses centralized normalizers for consistency across adapters.
 * 
 * Rules:
 * - NO backend calls (datasource handles that)
 * - Pure transformation functions
 * - Use centralized normalizers
 * - Return domain DTOs only (API_CONTRACTS.md)
 * 
 * @module lib/api/adapters/directus/actions/mapper
 */

/**
 * Maps raw backend action to domain InterventionAction DTO
 * 
 * @param raw - Raw backend action object
 * @returns Domain InterventionAction DTO
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mapActionToDomain = (raw: any): any => {
  if (!raw) return null;

  return {
    id: raw.id,
    description: raw.description,
    timeSpent: raw.time_spent,
    complexityScore: raw.complexity_score,
    createdAt: raw.created_at,
    technician: raw.tech
      ? {
          id: raw.tech.id,
          firstName: raw.tech.first_name,
          lastName: raw.tech.last_name,
        }
      : undefined,
    subcategory: raw.action_subcategory
      ? {
          id: raw.action_subcategory.id,
          code: raw.action_subcategory.code,
          name: raw.action_subcategory.name,
          category: raw.action_subcategory.category_id
            ? {
                id: raw.action_subcategory.category_id.id,
                code: raw.action_subcategory.category_id.code,
                name: raw.action_subcategory.category_id.name,
                color: raw.action_subcategory.category_id.color,
              }
            : undefined,
        }
      : undefined,
    intervention: raw.intervention_id
      ? {
          id: raw.intervention_id.id,
          code: raw.intervention_id.code,
          title: raw.intervention_id.title,
        }
      : undefined,
  };
};

/**
 * Maps domain InterventionAction payload to backend format
 * 
 * Converts camelCase domain names to snake_case backend names.
 * Only includes defined fields in the output.
 * 
 * @param payload - Domain InterventionAction payload
 * @returns Backend-compatible payload
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mapActionPayloadToBackend = (payload: any): Record<string, unknown> => {
  const backend: Record<string, unknown> = {};
  
  if (payload.description !== undefined) backend.description = payload.description;
  if (payload.timeSpent !== undefined) backend.time_spent = payload.timeSpent;
  if (payload.complexityScore !== undefined) backend.complexity_score = payload.complexityScore;
  if (payload.subcategory?.id !== undefined) backend.action_subcategory = payload.subcategory.id;
  if (payload.technician?.id !== undefined) backend.tech = payload.technician.id;
  // Ensure intervention_id is a string UUID, not an object
  if (payload.intervention?.id !== undefined) {
    backend.intervention_id = String(payload.intervention.id);
  } else if (payload.interventionId !== undefined) {
    backend.intervention_id = String(payload.interventionId);
  }
  
  return backend;
};
