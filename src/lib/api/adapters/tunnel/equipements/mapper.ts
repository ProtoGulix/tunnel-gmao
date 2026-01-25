/**
 * Equipements Mapper - Tunnel Backend
 *
 * Pure mapping functions. No HTTP calls.
 *
 * @module lib/api/adapters/tunnel/equipements/mapper
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const mapEquipementToDomain = (raw: any) => {
  if (!raw) return null;

  return {
    id: raw.id?.toString() || '',
    code: raw.code || undefined,
    name: raw.name || raw.code || 'Équipement',
    health: {
      level: raw.health?.level || 'ok',
      reason: raw.health?.reason || 'Aucun point bloquant',
    },
    parentId: raw.parent_id || null,
  };
};

export const mapEquipementDetailToDomain = (raw: any) => {
  if (!raw) return null;

  return {
    id: raw.id?.toString() || '',
    code: raw.code || undefined,
    name: raw.name || raw.code || 'Équipement',
    health: {
      level: raw.health?.level || 'ok',
      reason: raw.health?.reason || 'Aucun point bloquant',
      rulesTriggered: raw.health?.rules_triggered || [],
    },
    parentId: raw.parent_id || null,
    childrenIds: Array.isArray(raw.children_ids) ? raw.children_ids : [],
  };
};

export const mapEquipementStatsToDomain = (raw: any) => {
  if (!raw) return null;

  return {
    interventions: {
      open: raw.interventions?.open ?? 0,
      closed: raw.interventions?.closed ?? 0,
      byStatus: raw.interventions?.by_status || {},
      byPriority: raw.interventions?.by_priority || {},
    },
  };
};
