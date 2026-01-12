/**
 * Interventions Mapper (Backend → Domain)
 * 
 * Pure mapping functions. No backend calls. No HTTP. No apiCall wrapper.
 * Maps Directus responses to domain DTOs defined in API_CONTRACTS.md.
 * 
 * Uses centralized normalizers from @/lib/api/normalizers
 * 
 * @module lib/api/adapters/directus/interventions/mapper
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
// Mapper functions handle untyped backend data - type safety enforced at adapter boundary

import { normalizeInterventionStatus } from '@/lib/api/normalizers';

// ============================================================================
// Response Mappers (Backend → Domain)
// ============================================================================

/**
 * Maps a Directus intervention response to domain Intervention DTO.
 */
export const mapInterventionToDomain = (item: any) => {
  if (!item) return null;

  // Calculer la date d'ouverture réelle depuis status_log
  let openingDate = item.reported_date; // fallback
  if (item.status_log && Array.isArray(item.status_log) && item.status_log.length > 0) {
    // Chercher le premier log où le statut est devenu "ouvert" ou équivalent
    const openLog = item.status_log.find((log: any) => {
      const toValue = log.status_to?.value || log.status_to?.id;
      return toValue === 'ouvert' || toValue?.toLowerCase() === 'open';
    });
    if (openLog?.date) {
      openingDate = openLog.date;
    }
  }

  return {
    id: item.id,
    code: item.code,
    title: item.title,
    status: normalizeInterventionStatus(item.status_actual),
    type: item.type_inter || 'CUR',
    priority: item.priority || 'normal',
    createdAt: openingDate, // Date d'ouverture réelle calculée depuis status_log
    reportedDate: item.reported_date,
    printedFiche: item.printed_fiche ?? false,
    techInitials: item.tech_initials ?? undefined,
    machine: item.machine_id
      ? {
          id: item.machine_id.id,
          code: item.machine_id.code,
          name: item.machine_id.name,
        }
      : undefined,
    // Status log pour calculs de durée
    statusLog: item.status_log ? item.status_log.map(mapStatusLogToDomain) : undefined,
    // Optional nested data (present in fetchIntervention, absent in list)
    action: item.action ? item.action.map(mapActionToDomain) : undefined,
    parts: item.parts ? item.parts.map(mapPartToDomain) : undefined,
    assignedTo: item.assigned_to
      ? {
          id: item.assigned_to.id,
          firstName: item.assigned_to.first_name,
          lastName: item.assigned_to.last_name,
        }
      : undefined,
  };
};

/**
 * Maps a Directus intervention action response to domain InterventionAction DTO.
 */
export const mapActionToDomain = (item: any) => {
  if (!item) return null;

  return {
    id: item.id,
    description: item.description,
    timeSpent: item.time_spent,
    complexityScore: item.complexity_score,
    createdAt: item.created_at,
    purchaseRequestIds: Array.isArray(item.purchase_request_ids)
      ? item.purchase_request_ids
          .map((link: any) => {
            const pr = link?.purchase_request_id;
            return typeof pr === 'object' ? pr?.id : pr;
          })
          .filter(Boolean)
      : [],
    technician: item.tech
      ? {
          id: item.tech.id,
          firstName: item.tech.first_name,
          lastName: item.tech.last_name,
        }
      : undefined,
    subcategory: item.action_subcategory
      ? {
          id: item.action_subcategory.id,
          code: item.action_subcategory.code,
          name: item.action_subcategory.name,
          category_id: item.action_subcategory.category_id
            ? {
                code: item.action_subcategory.category_id.code,
                name: item.action_subcategory.category_id.name,
              }
            : undefined,
        }
      : undefined,
    intervention: item.intervention_id
      ? {
          id: item.intervention_id.id,
          code: item.intervention_id.code,
          title: item.intervention_id.title,
        }
      : undefined,
  };
};

/**
 * Maps a Directus part response to domain InterventionPart DTO.
 */
export const mapPartToDomain = (item: any) => {
  if (!item) return null;

  return {
    id: item.id,
    quantity: item.quantity,
    note: item.note,
    stockItem: item.stock_item_id
      ? {
          id: item.stock_item_id.id,
          ref: item.stock_item_id.ref,
          name: item.stock_item_id.name,
        }
      : undefined,
  };
};

/**
 * Maps a Directus status log response to domain InterventionStatusLog DTO.
 */
export const mapStatusLogToDomain = (item: any) => {
  if (!item) return null;

  return {
    id: item.id,
    date: item.date,
    from: item.status_from
      ? {
          id: item.status_from.id,
          value: normalizeInterventionStatus(item.status_from),
        }
      : undefined,
    to: item.status_to
      ? {
          id: item.status_to.id,
          value: normalizeInterventionStatus(item.status_to),
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
};

// ============================================================================
// Payload Mappers (Domain → Backend)
// ============================================================================

/**
 * Maps domain Intervention payload to Directus format.
 * Centralized to prevent divergence between create/update.
 */
export const mapInterventionDomainToBackend = (payload: any) => {
  const backend: any = {};
  if (payload.code !== undefined) backend.code = payload.code;
  if (payload.title !== undefined) backend.title = payload.title;

  // Map domain status (open|in_progress|closed|cancelled) to backend FK value
  if (payload.status !== undefined) {
    const mapStatusToBackend = (status: string) => {
      const normalized = (status || '').toLowerCase().trim();
      if (normalized === 'open') return 'ouvert';
      if (normalized === 'in_progress') return 'attente_pieces';
      if (normalized === 'closed') return 'ferme';
      if (normalized === 'cancelled') return 'cancelled';
      return status; // fallback: pass-through
    };
    backend.status_actual = mapStatusToBackend(payload.status);
  }

  if (payload.type !== undefined) backend.type_inter = payload.type;
  if (payload.priority !== undefined) backend.priority = payload.priority;
  if (payload.createdAt !== undefined) backend.created_at = payload.createdAt;
  if (payload.reportedDate !== undefined) backend.reported_date = payload.reportedDate;
  if (payload.printedFiche !== undefined) backend.printed_fiche = payload.printedFiche;
  if (payload.techInitials !== undefined) backend.tech_initials = payload.techInitials;
  if (payload.reportedBy?.id !== undefined) backend.reported_by = payload.reportedBy.id;
  if (payload.techInitials !== undefined) backend.tech_initials = payload.techInitials;
  if (payload.machine?.id !== undefined) backend.machine_id = payload.machine.id;
  return backend;
};

/**
 * Maps domain InterventionAction payload to Directus format.
 */
export const mapActionPayloadToBackend = (payload: any) => {
  const backend: any = {};
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

/**
 * Maps domain InterventionPart payload to Directus format.
 */
export const mapPartPayloadToBackend = (payload: any) => {
  const backend: any = {};
  if (payload.quantity !== undefined) backend.quantity = payload.quantity;
  if (payload.note !== undefined) backend.note = payload.note;
  if (payload.stockItem?.id !== undefined) backend.stock_item_id = payload.stockItem.id;
  // Ensure intervention_id is a string UUID, not an object
  if (payload.intervention?.id !== undefined) {
    backend.intervention_id = String(payload.intervention.id);
  } else if (payload.interventionId !== undefined) {
    backend.intervention_id = String(payload.interventionId);
  }
  return backend;
};
