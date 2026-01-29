/**
 * Actions Mapper - Tunnel Backend
 *
 * Pure mapping functions. No HTTP calls.
 *
 * @module lib/api/adapters/tunnel/actions/mapper
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const mapActionToDomain = (raw: any) => {
  if (!raw) return null;

  return {
    id: raw.id?.toString() || '',
    description: raw.description || '',
    timeSpent: Number(raw.time_spent ?? raw.timeSpent ?? 0),
    complexityScore: raw.complexity_score ?? raw.complexityScore,
    createdAt: raw.created_at || raw.updated_at || new Date().toISOString(),
    technician: raw.tech ? { id: String(raw.tech), firstName: '', lastName: '' } : undefined,
    subcategory: raw.subcategory
      ? {
          id: String(raw.subcategory.id),
          code: raw.subcategory.code || undefined,
          name: raw.subcategory.name || undefined,
        }
      : undefined,
    intervention: raw.intervention_id ? { id: String(raw.intervention_id) } : undefined,
  };
};

/**
 * Maps domain InterventionAction payload to tunnel-backend format
 *
 * Transforms domain camelCase to backend snake_case.
 *
 * Backend expects:
 * - intervention_id (uuid)
 * - description (string)
 * - time_spent (float, quarter hours: 0.25, 0.5, 0.75, 1.0...)
 * - action_subcategory (int)
 * - tech (uuid)
 * - complexity_score (int, 1-10)
 * - complexity_anotation (string, code from complexity_factor table)
 *
 * @param payload - Domain InterventionAction payload
 * @returns Backend-compatible payload
 */
export const mapActionPayloadToBackend = (payload: any): Record<string, unknown> => {
  const backend: Record<string, unknown> = {};

  // intervention_id is required
  if (payload.intervention?.id) {
    backend.intervention_id = String(payload.intervention.id);
  } else if (payload.interventionId) {
    backend.intervention_id = String(payload.interventionId);
  }

  // Optional fields
  if (payload.description !== undefined) backend.description = payload.description;
  if (payload.timeSpent !== undefined) backend.time_spent = payload.timeSpent;
  if (payload.complexityScore !== undefined) backend.complexity_score = payload.complexityScore;

  // Date field (created_at) - format YYYY-MM-DD
  if (payload.date !== undefined) {
    backend.created_at = payload.date;
  } else if (payload.createdAt !== undefined) {
    // If createdAt is provided as ISO string, extract date part
    const dateStr = typeof payload.createdAt === 'string'
      ? payload.createdAt.split('T')[0]
      : payload.createdAt;
    backend.created_at = dateStr;
  }

  // complexity_anotation: single code string (e.g., "AUT", "PCE")
  if (payload.complexityFactors !== undefined && Array.isArray(payload.complexityFactors)) {
    backend.complexity_anotation = payload.complexityFactors[0] || null;
  }

  // Subcategory: extract id if object, or pass directly if number/string
  if (payload.subcategory?.id !== undefined) {
    backend.action_subcategory = String(payload.subcategory.id);
  } else if (payload.subcategoryId !== undefined) {
    backend.action_subcategory = String(payload.subcategoryId);
  }

  // Technician: extract id if object, or pass directly if uuid string
  if (payload.technician?.id !== undefined) {
    backend.tech = String(payload.technician.id);
  } else if (payload.technicianId !== undefined) {
    backend.tech = String(payload.technicianId);
  }

  return backend;
};
