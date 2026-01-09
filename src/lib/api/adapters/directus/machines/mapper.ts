/**
 * Machines Mapper - Backend to Domain DTO Transformation
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
 * @module lib/api/adapters/directus/machines/mapper
 */

import { normalizeInterventionStatus } from '@/lib/api/normalizers';
import type { Machine, Intervention, MachineWithStats } from '@/lib/api/adapters/ApiAdapter';

/**
 * Maps raw backend machine to domain Machine DTO
 * 
 * @param raw - Raw backend machine object
 * @returns Domain Machine DTO
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mapMachineToDomain = (raw: any): Machine => {
  return {
    id: raw.id,
    code: raw.code ?? undefined,
    name: raw.name,
    zone: raw.zone_id 
      ? { id: raw.zone_id.id, name: raw.zone_id.name } 
      : undefined,
    workshop: raw.atelier_id 
      ? { id: raw.atelier_id.id, name: raw.atelier_id.name } 
      : undefined,
    parent: raw.equipement_mere
      ? { 
          id: raw.equipement_mere.id, 
          code: raw.equipement_mere.code, 
          name: raw.equipement_mere.name 
        }
      : undefined,
    tree: raw.equipement_tree
      ? { 
          id: raw.equipement_tree.id, 
          code: raw.equipement_tree.code, 
          name: raw.equipement_tree.name 
        }
      : undefined,
  };
};

/**
 * Maps raw backend intervention to domain Intervention DTO (minimal)
 * 
 * @param raw - Raw backend intervention object
 * @returns Domain Intervention DTO
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mapInterventionToDomain = (raw: any): Intervention => {
  return {
    id: raw.id,
    code: raw.code,
    title: raw.title,
    status: normalizeInterventionStatus(raw.status_actual),
    type: (raw.type_inter || 'UNKNOWN').toUpperCase() as 'CUR' | 'PRE' | 'PRO',
    priority: normalizePriority(raw.priority),
    reportedDate: raw.reported_date ?? undefined,
    machine: raw.machine_id
      ? { 
          id: raw.machine_id.id, 
          code: raw.machine_id.code, 
          name: raw.machine_id.name 
        }
      : undefined,
  };
};

/**
 * Normalizes priority from backend format to domain enum
 * 
 * @param raw - Raw priority value
 * @returns Domain priority value
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normalizePriority = (raw: any): 'faible' | 'normale' | 'important' | 'urgent' | undefined => {
  if (!raw) return undefined;
  
  const value = raw.toString().toLowerCase();
  
  if (value === 'urgent') return 'urgent';
  if (value === 'important' || value === 'high') return 'important';
  if (value === 'faible' || value === 'low') return 'faible';
  
  return 'normale';
};

/**
 * Enriches machines with intervention statistics
 * 
 * @param machines - Domain machines array
 * @param interventions - Domain interventions array
 * @returns Machines with stats (MachineWithStats[])
 */
export const enrichMachinesWithStats = (
  machines: Machine[], 
  interventions: Intervention[]
): MachineWithStats[] => {
  // Filter open interventions only - status is already normalized by mapInterventionToDomain
  // Exclude 'closed' status (mapped from backend 'ferme')
  const openInterventions = interventions.filter((i) => i.status !== 'closed');

  return machines.map((machine) => {
    // Get interventions for this machine
    const machineInterventions = openInterventions.filter(
      (i) => i.machine?.id === machine.id
    );

    // Count by type
    const interventionsByType = machineInterventions.reduce((acc, interv) => {
      const type = interv.type || 'UNKNOWN';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Compute status and color
    let status: 'ok' | 'maintenance' | 'warning' | 'critical' = 'ok';
    let statusColor: 'green' | 'blue' | 'orange' | 'red' = 'green';

    if (machineInterventions.length > 0) {
      const hasUrgent = machineInterventions.some((i) => i.priority === 'urgent');
      const hasCurative = (interventionsByType['CUR'] || 0) > 0;

      if (hasUrgent) {
        status = 'critical';
        statusColor = 'red';
      } else if (hasCurative) {
        status = 'warning';
        statusColor = 'orange';
      } else {
        status = 'maintenance';
        statusColor = 'blue';
      }
    }

    return {
      ...machine,
      openInterventionsCount: machineInterventions.length,
      interventionsByType,
      status,
      statusColor,
      interventions: machineInterventions,
    };
  });
};
