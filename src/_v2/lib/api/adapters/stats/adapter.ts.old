/**
 * Stats Adapter - service status metrics
 *
 * Calls the tunnel-backend `/stats/service-status` endpoint and normalizes the
 * response to the frontend ServiceStatus domain shape.
 */

import axios from 'axios';
import { apiCall } from '@/lib/api/errors';
import type { ServiceStatusMetrics, StatsNamespace, ServiceStatusCause, ServiceStatusSiteConsumption } from '@/lib/api/adapters/ApiAdapter';

const TUNNEL_BACKEND_URL = import.meta.env.VITE_TUNNEL_BACKEND_URL || 'http://localhost:8000';

const tunnelApi = axios.create({
  baseURL: TUNNEL_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth header if available
tunnelApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const toNumber = (value: unknown, fallback = 0): number => {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
};

const toDateParam = (value?: Date | string): string | undefined => {
  if (!value) return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
};

const mapTopCauses = (fragmentation: unknown): ServiceStatusCause[] => {
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

const mapSiteConsumption = (siteConsumption: unknown): ServiceStatusSiteConsumption[] => {
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

const mapServiceStatusResponse = (payload: unknown): ServiceStatusMetrics => {
  const data = payload as Record<string, unknown>;
  const breakdown = (data?.breakdown || {}) as Record<string, unknown>;
  const fragmentation = (data?.fragmentation || {}) as Record<string, unknown>;
  const pilotage = (data?.pilotage || {}) as Record<string, unknown>;
  const capacity = (data?.capacity || {}) as Record<string, unknown>;

  const timeBreakdown = {
    PROD: toNumber(breakdown.prod_hours),
    DEP: toNumber(breakdown.dep_hours),
    PILOT: toNumber(breakdown.pilot_hours),
    FRAG: toNumber(breakdown.frag_hours),
  };

  const totalHours = toNumber(breakdown.total_hours, Object.values(timeBreakdown).reduce((sum, value) => sum + value, 0));

  const causes = mapTopCauses(fragmentation);
  const sites = mapSiteConsumption(data?.site_consumption);

  return {
    chargePercent: toNumber(capacity.charge_percent),
    fragPercent: toNumber(fragmentation.frag_percent, totalHours > 0 ? (timeBreakdown.FRAG / totalHours) * 100 : 0),
    pilotPercent: toNumber(pilotage.pilot_percent, totalHours > 0 ? (timeBreakdown.PILOT / totalHours) * 100 : 0),
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

export const statsAdapter: StatsNamespace = {
  async fetchServiceStatus(params = {}) {
    const { startDate, endDate } = params;

    return apiCall(async () => {
      const response = await tunnelApi.get('/stats/service-status', {
        params: {
          start_date: toDateParam(startDate),
          end_date: toDateParam(endDate),
        },
      });

      return mapServiceStatusResponse(response.data);
    }, 'Stats.fetchServiceStatus');
  },
};
