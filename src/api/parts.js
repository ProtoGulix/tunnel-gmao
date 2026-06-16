/**
 * API pièces — nouveau système centré sur les références fabricant (V4)
 *
 * @module api/parts
 */

import { api } from '@/lib/api/client';

// ─── Parts ────────────────────────────────────────────────────────────────────

export async function fetchParts(params = {}) {
  const response = await api.get('/parts', { params });
  return response.data || { items: [], pagination: {}, facets: { families: [] } };
}

export async function fetchPartDetail(id) {
  const response = await api.get(`/parts/${id}`);
  return response.data || null;
}

export async function fetchPartByRef(internalRef) {
  const response = await api.get(`/parts/ref/${internalRef}`);
  return response.data || null;
}

export async function createPart(payload) {
  const response = await api.post('/parts', payload);
  return response.data || null;
}

export async function updatePart(id, updates) {
  const response = await api.patch(`/parts/${id}`, updates);
  return response.data || null;
}

export async function deletePart(id) {
  await api.delete(`/parts/${id}`);
}

// ─── Références fabricant ─────────────────────────────────────────────────────

export async function addManufacturerRef(partId, payload) {
  const response = await api.post(`/parts/${partId}/manufacturer-refs`, payload);
  return response.data || null;
}

export async function updateManufacturerRef(refId, updates) {
  const response = await api.patch(`/parts/manufacturer-refs/${refId}`, updates);
  return response.data || null;
}

export async function deleteManufacturerRef(refId) {
  await api.delete(`/parts/manufacturer-refs/${refId}`);
}

export async function setPreferredManufacturerRef(refId) {
  const response = await api.post(`/parts/manufacturer-refs/${refId}/set-preferred`);
  return response.data || null;
}

// ─── Références fournisseur ───────────────────────────────────────────────────

export async function addSupplierRef(mfrRefId, payload) {
  const response = await api.post(`/parts/manufacturer-refs/${mfrRefId}/supplier-refs`, payload);
  return response.data || null;
}

export async function updateSupplierRef(supRefId, updates) {
  const response = await api.patch(`/parts/supplier-refs/${supRefId}`, updates);
  return response.data || null;
}

export async function deleteSupplierRef(supRefId) {
  await api.delete(`/parts/supplier-refs/${supRefId}`);
}

export async function setPreferredSupplierRef(supRefId) {
  const response = await api.post(`/parts/supplier-refs/${supRefId}/set-preferred`);
  return response.data || null;
}
