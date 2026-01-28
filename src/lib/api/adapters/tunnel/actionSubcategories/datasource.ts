/**
 * Action Subcategories Datasource - Tunnel Backend
 *
 * Raw HTTP calls only. Returns unprocessed tunnel-backend responses.
 *
 * @module lib/api/adapters/tunnel/actionSubcategories/datasource
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { tunnelApi } from '../client';

export const fetchSubcategoriesRaw = async () => {
  const response = await tunnelApi.get('/action_subcategories/');
  const list = Array.isArray(response.data) ? response.data : response.data?.data || [];
  return list || [];
};
