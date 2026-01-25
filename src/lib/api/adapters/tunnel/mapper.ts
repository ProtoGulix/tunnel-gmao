/**
 * Tunnel Backend Mapper
 *
 * Pure mapping functions. No HTTP calls. No apiCall wrapper.
 * Maps tunnel-backend responses to domain DTOs defined in API_CONTRACTS.md.
 *
 * Uses centralized normalizers from @/lib/api/normalizers
 *
 * @module lib/api/adapters/tunnel/mapper
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

// ============================================================================
// Auth Mappers
// ============================================================================

export const mapAuthTokens = (raw: any) => ({
  accessToken: raw?.access_token || '',
  refreshToken: raw?.refresh_token || '',
  expires: raw?.expires,
});

// ============================================================================
// Intervention Mappers
// ============================================================================

export const mapInterventionToDomain = (raw: any) => {
  if (!raw) return null;

  return {
    id: raw.id?.toString() || '',
    code: raw.code || '',
    title: raw.title || raw.description || '',
    // Pass-through status from backend (no legacy mapping)
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

// ============================================================================
// Status Refs Mapper
// ============================================================================

export const mapStatusRefToDomain = (raw: any) => {
  if (!raw) return null;

  return {
    id: raw.id?.toString() || '',
    code: raw.code || raw.value || '',
    name: raw.name || raw.label || '',
    value: raw.value || undefined,
    color: raw.color || undefined,
  };
};

// ============================================================================
// Action Subcategories Mapper
// ============================================================================

export const mapSubcategoryToDomain = (raw: any) => {
  if (!raw) return null;

  return {
    id: raw.id?.toString() || '',
    code: raw.code || undefined,
    name: raw.name || '',
  };
};

// ============================================================================
// Equipements Mappers
// ============================================================================

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

// ============================================================================
// Stats Mappers
// ============================================================================

const toNumber = (value: unknown, fallback = 0): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const mapTopCauses = (fragmentation: unknown) => {
  const frag = fragmentation as Record<string, unknown>;
  const items = Array.isArray(frag?.top_causes) ? frag.top_causes : [];

  return items.map((cause: Record<string, unknown>, index: number) => ({
    subcategoryId: (cause?.id ?? index + 1) as string | number,
    subcategoryCode: String(cause?.code || cause?.name || `CAUSE-${index + 1}`),
    subcategoryName: String(cause?.name || 'Cause inconnue'),
    totalHours: toNumber(cause?.total_hours),
    actionCount: toNumber(cause?.action_count),
    percent: toNumber(cause?.percent),
  }));
};

const mapSiteConsumption = (siteConsumption: unknown) => {
  const items = Array.isArray(siteConsumption) ? siteConsumption : [];

  return items.map((site: Record<string, unknown>, index: number) => ({
    equipmentId: (site?.site_id ?? site?.site_name ?? index + 1) as string | number,
    equipmentName: String(site?.site_name || 'Site'),
    equipmentCode: site?.site_code ? String(site.site_code) : undefined,
    totalHours: toNumber(site?.total_hours),
    fragHours: toNumber(site?.frag_hours),
    percentTotal: toNumber(site?.percent_total),
    percentFrag: toNumber(site?.percent_frag),
  }));
};

export const mapServiceStatusToDomain = (raw: any) => {
  if (!raw) return null;

  const breakdown = (raw?.breakdown || {}) as Record<string, unknown>;
  const fragmentation = (raw?.fragmentation || {}) as Record<string, unknown>;
  const pilotage = (raw?.pilotage || {}) as Record<string, unknown>;
  const capacity = (raw?.capacity || {}) as Record<string, unknown>;

  const timeBreakdown = {
    PROD: toNumber(breakdown.prod_hours),
    DEP: toNumber(breakdown.dep_hours),
    PILOT: toNumber(breakdown.pilot_hours),
    FRAG: toNumber(breakdown.frag_hours),
  };

  const totalHours = toNumber(
    breakdown.total_hours,
    Object.values(timeBreakdown).reduce((sum, value) => sum + value, 0)
  );

  const causes = mapTopCauses(fragmentation);
  const sites = mapSiteConsumption(raw?.site_consumption);

  return {
    chargePercent: toNumber(capacity.charge_percent),
    fragPercent: toNumber(
      fragmentation.frag_percent,
      totalHours > 0 ? (timeBreakdown.FRAG / totalHours) * 100 : 0
    ),
    pilotPercent: toNumber(
      pilotage.pilot_percent,
      totalHours > 0 ? (timeBreakdown.PILOT / totalHours) * 100 : 0
    ),
    timeBreakdown,
    totalHours,
    shortActionsPercent: toNumber(fragmentation.short_action_percent),
    fragmentation: {
      total: timeBreakdown.FRAG,
      items: causes,
      status: fragmentation.status,
    },
    siteConsumption: {
      totalServiceHours: totalHours,
      totalFragHours: timeBreakdown.FRAG,
      items: sites,
    },
    statuses: {
      charge: capacity.status,
      frag: fragmentation.status,
      pilot: pilotage.status,
    },
  };
};
