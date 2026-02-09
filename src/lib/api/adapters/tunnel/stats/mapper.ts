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

/**
 * Mappe les données de charge technique du backend vers le domaine
 * 
 * Format API ChargeTechniqueResponse:
 * - params: { start_date, end_date, period_type }
 * - guide: { objectif, seuils_taux_evitable, actions_par_categorie }
 * - periods: [{ period, charges, taux_depannage_evitable, cause_breakdown, by_equipement_class }]
 */
export const mapTechnicalWorkloadToDomain = (raw: any) => {
  if (!raw) return null;

  const params = raw.params || {};
  const rawGuide = raw.guide || {};
  const periods = Array.isArray(raw.periods) ? raw.periods : [];

  // Mapper le guide
  const guide = {
    objectif: rawGuide.objectif || '',
    seuilsTauxEvitable: Array.isArray(rawGuide.seuils_taux_evitable)
      ? rawGuide.seuils_taux_evitable.map((s: any) => ({
          min: s.min ?? 0,
          max: s.max ?? null,
          color: s.color || 'gray',
          label: s.label || '',
          action: s.action || '',
        }))
      : [],
    actionsParCategorie: Array.isArray(rawGuide.actions_par_categorie)
      ? rawGuide.actions_par_categorie.map((a: any) => ({
          category: a.category || '',
          color: a.color || '#6b7280',
          action: a.action || '',
        }))
      : [],
  };

  // Mapper chaque période
  const mappedPeriods = periods.map((p: any) => {
    const period = p.period || {};
    const charges = p.charges || {};
    const tauxEvitable = p.taux_depannage_evitable || {};
    const causeBreakdown = Array.isArray(p.cause_breakdown) ? p.cause_breakdown : [];
    const byEquipementClass = Array.isArray(p.by_equipement_class) ? p.by_equipement_class : [];

    return {
      period: {
        startDate: period.start_date || null,
        endDate: period.end_date || null,
        days: toNumber(period.days),
      },
      charges: {
        chargeTotale: toNumber(charges.charge_totale),
        chargeDepannage: toNumber(charges.charge_depannage),
        chargeConstructive: toNumber(charges.charge_constructive),
        chargeDepannageEvitable: toNumber(charges.charge_depannage_evitable),
        chargeDepannageSubi: toNumber(charges.charge_depannage_subi),
      },
      tauxDepannageEvitable: {
        taux: toNumber(tauxEvitable.taux),
        status: tauxEvitable.status || { color: 'gray', text: '' },
      },
      causeBreakdown: causeBreakdown.map((cause: any) => ({
        code: String(cause.code || ''),
        label: cause.label || null,
        category: cause.category || null,
        hours: toNumber(cause.hours),
        actionCount: toNumber(cause.action_count),
        percent: toNumber(cause.percent),
      })),
      byEquipementClass: byEquipementClass.map((ec: any) => {
        const evitableBreakdown = ec.evitable_breakdown || {};
        const topCauses = Array.isArray(ec.top_causes) ? ec.top_causes : [];

        return {
          equipementClassId: ec.equipement_class_id || null,
          equipementClassCode: String(ec.equipement_class_code || ''),
          equipementClassLabel: String(ec.equipement_class_label || ''),
          chargeTotale: toNumber(ec.charge_totale),
          chargeDepannage: toNumber(ec.charge_depannage),
          chargeConstructive: toNumber(ec.charge_constructive),
          chargeDepannageEvitable: toNumber(ec.charge_depannage_evitable),
          tauxDepannageEvitable: toNumber(ec.taux_depannage_evitable),
          status: ec.status || { color: 'gray', text: '' },
          // Nouvelles données enrichies
          evitableBreakdown: {
            hoursWithFactor: toNumber(evitableBreakdown.hours_with_factor),
            hoursSystemic: toNumber(evitableBreakdown.hours_systemic),
            hoursBoth: toNumber(evitableBreakdown.hours_both),
            totalEvitable: toNumber(evitableBreakdown.total_evitable),
          },
          explanation: ec.explanation || null,
          topCauses: topCauses.map((cause: any) => ({
            code: String(cause.code || ''),
            label: cause.label || null,
            category: cause.category || null,
            hours: toNumber(cause.hours),
            percent: toNumber(cause.percent),
          })),
          recommendedAction: ec.recommended_action || null,
        };
      }),
    };
  });

  return {
    params: {
      startDate: params.start_date || null,
      endDate: params.end_date || null,
      periodType: params.period_type || 'custom',
    },
    guide,
    periods: mappedPeriods,
    // Raccourcis pour accès direct à la première période (cas custom)
    current: mappedPeriods[0] || null,
  };
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
