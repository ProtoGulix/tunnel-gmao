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

export async function fetchSupplierPartRefs({ supplierId, search, limit, skip } = {}) {
  const params = {};
  if (supplierId) params.supplier_id = supplierId;
  if (search) params.search = search;
  if (limit != null) params.limit = limit;
  if (skip != null) params.skip = skip;
  const response = await api.get('/parts/supplier-refs', { params });
  return response.data || { items: [], pagination: {} };
}

export async function createPart(payload) {
  const response = await api.post('/parts', payload);
  return response.data || null;
}

/**
 * Crée une pièce, puis lie optionnellement des fournisseurs à ses références fabricant.
 * `payload.supplier_refs_by_mfr_index` (optionnel) : [{ mfrIndex, supplier_id, supplier_ref, ... }] — voir PartForm.
 * `mfrIndex` correspond à la position de la référence fabricant dans `payload.manufacturer_refs`.
 */
export async function createPartWithSupplierRef(payload) {
  const { supplier_refs_by_mfr_index: supplierRefs, ...partPayload } = payload;
  const part = await createPart(partPayload);
  if (!supplierRefs?.length) return part;

  for (const { mfrIndex, ...supplierRefPayload } of supplierRefs) {
    const mfrRefId = part.manufacturer_refs?.[mfrIndex]?.id;
    if (!mfrRefId) continue;
    // Séquentiel pour éviter des courses sur is_preferred au sein d'une même référence fabricant
    await addSupplierRef(mfrRefId, supplierRefPayload);
  }
  return fetchPartDetail(part.id);
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
