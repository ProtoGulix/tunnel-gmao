/**
 * @fileoverview Fabricants (manufacturer-items) API
 * @module api/manufacturers
 */

import { api } from '@/lib/api/client';

export async function fetchManufacturers(params = {}) {
  const response = await api.get('/manufacturer-items', { params });
  // Retourne { items, pagination } — format paginé
  return response.data || { items: [], pagination: null };
}

export async function fetchManufacturerDetail(id) {
  const response = await api.get(`/manufacturer-items/${id}`);
  return response.data || null;
}

export async function createManufacturer(payload) {
  const response = await api.post('/manufacturer-items', payload);
  return response.data || null;
}

export async function updateManufacturer(id, updates) {
  const response = await api.patch(`/manufacturer-items/${id}`, updates);
  return response.data || null;
}

export async function deleteManufacturer(id) {
  await api.delete(`/manufacturer-items/${id}`);
}
