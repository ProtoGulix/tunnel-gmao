/**
 * Stats Adapter - Tunnel Backend
 *
 * Backend-agnostic domain interface for service status metrics.
 *
 * @module lib/api/adapters/tunnel/stats/adapter
 */

import { apiCall } from '@/lib/api/errors';
import * as datasource from './datasource';
import * as mapper from './mapper';

interface DateRangeParams {
  startDate?: string;
  endDate?: string;
}

export const statsAdapter = {
  async fetchServiceStatus(params: DateRangeParams = {}) {
    return apiCall(async () => {
      const raw = await datasource.fetchServiceStatusRaw(params.startDate, params.endDate);
      return mapper.mapServiceStatusToDomain(raw);
    }, 'TunnelStats.fetchServiceStatus');
  },

  async fetchTechnicalWorkload(params: DateRangeParams = {}) {
    return apiCall(async () => {
      const raw = await datasource.fetchTechnicalWorkloadRaw(params.startDate, params.endDate);
      return mapper.mapTechnicalWorkloadToDomain(raw);
    }, 'TunnelStats.fetchTechnicalWorkload');
  },

  async fetchAnomaliesSaisie(params: DateRangeParams = {}) {
    return apiCall(async () => {
      const raw = await datasource.fetchAnomaliesSaisieRaw(params.startDate, params.endDate);
      return mapper.mapAnomaliesSaisieToDomain(raw);
    }, 'TunnelStats.fetchAnomaliesSaisie');
  },
};
