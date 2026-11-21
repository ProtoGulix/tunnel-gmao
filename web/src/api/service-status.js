/**
 * API État du Service
 *
 * Appels HTTP pour l'analyse de l'état du service maintenance.
 * Endpoint backend : /stats/service-status
 *
 * @module api/service-status
 */

import { api } from '@/lib/api/client';

/**
 * Normalise un nombre
 */
const toNumber = (value, fallback = 0) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

/**
 * Mappe les causes de fragmentation
 */
const mapTopCauses = (fragmentation) => {
  const items = Array.isArray(fragmentation?.top_causes) ? fragmentation.top_causes : [];

  return items.map((cause, index) => ({
    subcategoryId: index + 1,
    subcategoryCode: String(cause?.name || `CAUSE-${index + 1}`)
      .substring(0, 10)
      .toUpperCase(),
    subcategoryName: String(cause?.name || 'Cause inconnue'),
    totalHours: toNumber(cause?.total_hours),
    actionCount: toNumber(cause?.action_count),
    percent: toNumber(cause?.percent),
  }));
};

/**
 * Mappe la consommation par site
 */
const mapSiteConsumption = (siteConsumption) => {
  const items = Array.isArray(siteConsumption) ? siteConsumption : [];

  return items.map((site, index) => ({
    equipmentId: index + 1,
    equipmentName: String(site?.site_name || 'Site'),
    totalHours: toNumber(site?.total_hours),
    fragHours: toNumber(site?.frag_hours),
    percentTotal: toNumber(site?.percent_total),
    percentFrag: toNumber(site?.percent_frag),
  }));
};

/**
 * Mappe la série mensuelle ; un pourcentage null (mois sans heure) reste null, jamais 0.
 * Absente (ancienne API) : null.
 */
const mapMonthly = (monthly) => {
  if (!Array.isArray(monthly)) return null;
  return monthly.map((m) => ({
    month: m?.month,
    chargePercent: m?.charge_percent ?? null,
    fragPercent: m?.frag_percent ?? null,
    pilotPercent: m?.pilot_percent ?? null,
  }));
};

/**
 * Mappe les données de l'API vers le format domain
 */
const mapServiceStatusResponse = (raw) => {
  if (!raw) return null;

  const breakdown = raw.breakdown || {};
  const fragmentation = raw.fragmentation || {};
  const pilotage = raw.pilotage || {};
  const capacity = raw.capacity || {};

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

  return {
    chargePercent: toNumber(capacity.charge_percent),
    fragPercent: toNumber(fragmentation.frag_percent),
    pilotPercent: toNumber(pilotage.pilot_percent),
    timeBreakdown,
    totalHours,
    shortActionsPercent: toNumber(fragmentation.short_action_percent),
    fragmentation: {
      items: mapTopCauses(fragmentation),
    },
    siteConsumption: {
      items: mapSiteConsumption(raw.site_consumption),
    },
    // Courbe et tendance (ADR 0034 point 12) ; absentes sur une ancienne API
    monthly: mapMonthly(raw.monthly),
    trends: raw.trends ?? null,
    // Seuils de statut fournis par l'API ; absents sur une ancienne API
    thresholds: raw.thresholds ?? null,
    statuses: {
      charge: capacity.status,
      frag: fragmentation.status,
      pilot: pilotage.status,
    },
  };
};

/**
 * Récupère les données d'état du service pour une période donnée
 * @param {string} startDate - Début de période, AAAA-MM-JJ
 * @param {string} endDate - Fin de période, AAAA-MM-JJ
 * @returns {Promise<Object>} Données d'état du service (charge, fragmentation, pilotage)
 */
export async function fetchServiceStatus(startDate, endDate) {
  const response = await api.get('/stats/service-status', {
    params: {
      start_date: startDate,
      end_date: endDate,
    },
  });

  return mapServiceStatusResponse(response.data);
}
