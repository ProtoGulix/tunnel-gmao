/**
 * Intervention Status Refs Datasource - Tunnel Backend
 *
 * Raw HTTP calls only. Returns unprocessed tunnel-backend responses.
 *
 * @module lib/api/adapters/tunnel/interventionStatusRefs/datasource
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { tunnelApi } from '../client';

export const fetchStatusRefsRaw = async () => {
  const response = await tunnelApi.get('/intervention_status');
  const list = Array.isArray(response.data) ? response.data : response.data?.data || [];
  return list || [];
};
