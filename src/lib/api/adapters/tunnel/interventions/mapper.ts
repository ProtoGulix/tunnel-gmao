/**
 * Interventions Mapper - Tunnel Backend
 *
 * Pure mapping functions. No HTTP calls.
 *
 * @module lib/api/adapters/tunnel/interventions/mapper
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { mapActionToDomain } from '../actions/mapper';

/**
 * Maps French status code to normalized DTO status
 * Inverse of mapDtoStatusToConfigKey in interventionUtils.jsx
 */
const mapConfigKeyToDto = (configKey: string): string => {
  const mapping: Record<string, string> = {
    ouvert: 'open',
    attente_pieces: 'in_progress',
    attente_prod: 'in_progress',
    ferme: 'closed',
    cancelled: 'cancelled',
  };
  return mapping[configKey] || 'open';
};

/**
 * Maps status log from backend to domain model
 * Format compatible with existing frontend timeline code
 */
export const mapStatusLogToDomain = (raw: any) => {
  if (!raw) return null;

  return {
    id: raw.id?.toString() || '',
    interventionId: raw.intervention_id?.toString() || '',
    from: raw.status_from_detail
      ? {
          id: raw.status_from_detail.code || '',
          value: mapConfigKeyToDto(raw.status_from_detail.code || ''),
          label: raw.status_from_detail.label || null,
          color: raw.status_from_detail.color || null,
        }
      : null,
    to: raw.status_to_detail
      ? {
          id: raw.status_to_detail.code || '',
          value: mapConfigKeyToDto(raw.status_to_detail.code || ''),
          label: raw.status_to_detail.label || null,
          color: raw.status_to_detail.color || null,
        }
      : null,
    technicianId: raw.technician_id?.toString() || null,
    date: raw.date || '',
    notes: raw.notes || null,
  };
};

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
    updatedBy: raw.updated_by,
    stats: raw.stats
      ? {
          action_count: raw.stats.action_count || 0,
          total_time: raw.stats.total_time || 0,
          avg_complexity: raw.stats.avg_complexity || null,
          purchase_count: raw.stats.purchase_count || 0,
        }
      : {
          action_count: 0,
          total_time: 0,
          avg_complexity: null,
          purchase_count: 0,
        },
    machine: raw.equipements
      ? {
          id: raw.equipements.id?.toString() || '',
          code: raw.equipements.code || undefined,
          name: raw.equipements.name || raw.equipements.code || 'Équipement',
          health: raw.equipements.health
            ? {
                level: raw.equipements.health.level || 'ok',
                reason: raw.equipements.health.reason || '',
              }
            : undefined,
          parent_id: raw.equipements.parent_id || undefined,
          children_ids: raw.equipements.children_ids || [],
        }
      : undefined,
    action: Array.isArray(raw.actions)
      ? raw.actions.map(mapActionToDomain).filter(Boolean)
      : [],
    statusLogs: Array.isArray(raw.status_logs)
      ? raw.status_logs.map(mapStatusLogToDomain).filter(Boolean)
      : [],
  };
};

/**
 * Maps domain intervention payload to tunnel-backend format
 */
export const mapInterventionPayloadToBackend = (payload: any): Record<string, unknown> => {
  const backend: Record<string, unknown> = {};

  if (payload.title !== undefined) backend.title = payload.title;

  const machineId = payload.machine?.id ?? payload.machine_id;
  if (machineId !== undefined) backend.machine_id = machineId;

  if (payload.type !== undefined) backend.type_inter = payload.type;
  if (payload.type_inter !== undefined) backend.type_inter = payload.type_inter;

  if (payload.priority !== undefined) backend.priority = payload.priority;
  if (payload.reportedBy !== undefined) backend.reported_by = payload.reportedBy;
  if (payload.reported_by !== undefined) backend.reported_by = payload.reported_by;

  if (payload.techInitials !== undefined) backend.tech_initials = payload.techInitials;
  if (payload.tech_initials !== undefined) backend.tech_initials = payload.tech_initials;

  if (payload.status !== undefined) backend.status_actual = payload.status;
  if (payload.status_actual !== undefined) backend.status_actual = payload.status_actual;

  if (payload.printedFiche !== undefined) backend.printed_fiche = payload.printedFiche;
  if (payload.printed_fiche !== undefined) backend.printed_fiche = payload.printed_fiche;

  if (payload.reportedDate !== undefined) backend.reported_date = payload.reportedDate;
  if (payload.reported_date !== undefined) backend.reported_date = payload.reported_date;

  if (payload.createdAt !== undefined) backend.created_at = payload.createdAt;
  if (payload.created_at !== undefined) backend.created_at = payload.created_at;

  return backend;
};
