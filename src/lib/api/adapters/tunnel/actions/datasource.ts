/**
 * Actions Datasource - Tunnel Backend
 *
 * Raw HTTP calls only. Returns unprocessed tunnel-backend responses.
 *
 * @module lib/api/adapters/tunnel/actions/datasource
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { tunnelApi } from '../client';

export const fetchActionsRaw = async (interventionId?: string) => {
  if (interventionId) {
    const { data } = await tunnelApi.get(`/interventions/${interventionId}/actions`);
    const list = Array.isArray(data) ? data : data?.data || [];
    return list;
  }

  const response = await tunnelApi.get('/intervention_actions');
  const list = Array.isArray(response.data) ? response.data : response.data?.data || [];
  return list;
};
