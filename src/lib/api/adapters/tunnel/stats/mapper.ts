/**
 * Stats Mapper - Tunnel Backend
 *
 * Pure mapping functions. No HTTP calls.
 *
 * @module lib/api/adapters/tunnel/stats/mapper
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

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
