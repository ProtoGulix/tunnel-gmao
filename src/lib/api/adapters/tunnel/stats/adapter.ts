/**
 * Stats Adapter - Tunnel Backend
 *
 * Backend-agnostic domain interface for service status metrics.
 *
 * @module lib/api/adapters/tunnel/stats/adapter
 */

import { apiCall } from '@/lib/api/errors';
import * as datasource from '../datasource';
import * as mapper from '../mapper';

export const statsAdapter = {
  async fetchServiceStatus(params: any = {}) {
    return apiCall(async () => {
      const raw = await datasource.fetchServiceStatusRaw(params.startDate, params.endDate);
      return mapper.mapServiceStatusToDomain(raw);
    }, 'TunnelStats.fetchServiceStatus');
  },
};
