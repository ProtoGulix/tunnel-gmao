/**
 * API Admin — Catalogue des endpoints
 * @module api/adminEndpoints
 */

import { api } from '@/lib/api/client';

export async function fetchAdminEndpoints(params = {}) {
  const response = await api.get('/admin/endpoints', { params });
  return response.data?.data || response.data;
}

export async function updateAdminEndpoint(id, data) {
  const response = await api.patch(`/admin/endpoints/${id}`, data);
  return response.data?.data || response.data;
}

export async function syncAdminEndpoints() {
  const response = await api.post('/admin/endpoints/sync');
  return response.data?.data || response.data;
}
