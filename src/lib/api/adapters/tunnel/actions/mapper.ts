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
