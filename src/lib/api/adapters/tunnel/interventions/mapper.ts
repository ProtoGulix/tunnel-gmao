/**
 * Interventions Mapper - Tunnel Backend
 *
 * Pure mapping functions. No HTTP calls.
 *
 * @module lib/api/adapters/tunnel/interventions/mapper
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const mapInterventionToDomain = (raw: any) => {
  if (!raw) return null;

  return {
    id: raw.id?.toString() || '',
    code: raw.code || '',
    title: raw.title || raw.description || '',
    status: raw.status_actual || raw.status || '',
    type: raw.type_inter || raw.type || 'CUR',
    priority: raw.priority,
    createdAt: raw.reported_date || raw.created_at,
    reportedDate: raw.reported_date,
    printedFiche: raw.printed_fiche,
    techInitials: raw.tech_initials,
    machine: raw.equipements
      ? {
          id: raw.equipements.id?.toString() || '',
          code: raw.equipements.code || undefined,
          name: raw.equipements.name || raw.equipements.code || 'Équipement',
        }
      : undefined,
  };
};
