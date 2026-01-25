/**
 * Intervention Status Refs Adapter - Tunnel Backend
 *
 * Backend-agnostic domain interface. Orchestrates datasource + mapper.
 *
 * @module lib/api/adapters/tunnel/interventionStatusRefs/adapter
 */

import { apiCall } from '@/lib/api/errors';
import * as datasource from './datasource';
import * as mapper from './mapper';

export const interventionStatusRefsAdapter = {
  async fetchStatusRefs() {
    return apiCall(async () => {
      const raw = await datasource.fetchStatusRefsRaw();
      return raw.map(mapper.mapStatusRefToDomain).filter(Boolean);
    }, 'TunnelInterventionStatusRefs.fetchStatusRefs');
  },
};
