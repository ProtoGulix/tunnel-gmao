/**
 * Purchase Requests API
 *
 * @module api/purchaseRequests
 */

import { api } from '@/lib/api/client';

/**
 * Fetch purchase requests (light list for table)
 * @param {Object} params
 * @param {string} [params.status]
 * @param {string} [params.urgency]
 * @param {string} [params.search]
 * @param {string} [params.intervention_id]
 * @returns {Promise<Array>}
 */
export async function fetchPurchaseRequests(params = {}) {
  const response = await api.get('/purchase-requests/list', { params });
  return response.data.data ?? [];
}

/**
 * Fetch detailed purchase request by ID
 * @param {string} id
 * @returns {Promise<Object>}
 */
export async function fetchPurchaseRequestDetail(id) {
  const response = await api.get(`/purchase-requests/detail/${id}`);
  return response.data.data;
}

/**
 * Fetch purchase requests stats
 * @param {Object} params
 * @param {string} [params.start_date]
 * @param {string} [params.end_date]
 * @returns {Promise<Object>}
 */
export async function fetchPurchaseRequestStats(params = {}) {
  const response = await api.get('/purchase-requests/stats', { params });
  return response.data;
}

/**
 * Fetch real-time status facets (no date filter)
 * @returns {Promise<{ by_status: Array, pending_dispatch_count: number }>}
 */
export async function fetchPurchaseRequestFacets() {
  const response = await api.get('/purchase-requests/facets');
  return response.data;
}

/**
 * Fetch purchase requests for an intervention
 * @param {string} interventionId
 * @param {string} [view='list'] - 'list' or 'full'
 * @returns {Promise<Array>}
 */
export async function fetchPurchaseRequestsByIntervention(interventionId, view = 'list') {
  const response = await api.get(`/purchase-requests/intervention/${interventionId}/optimized`, {
    params: { view },
  });
  return response.data ?? [];
}

/**
 * Create a purchase request
 * @param {Object} payload
 * @returns {Promise<Object>}
 */
export async function createPurchaseRequest(payload) {
  const response = await api.post('/purchase-requests', payload);
  return response.data;
}

/**
 * Update a purchase request
 * @param {string} id
 * @param {Object} updates
 * @returns {Promise<Object>}
 */
export async function updatePurchaseRequest(id, updates) {
  const response = await api.put(`/purchase-requests/${id}`, updates);
  return response.data;
}

/**
 * Delete a purchase request
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deletePurchaseRequest(id) {
  await api.delete(`/purchase-requests/${id}`);
}

/**
 * Fetch all possible derived statuses with labels and colors
 * @returns {Promise<Array>} [{ code, label, color }]
 */
export async function fetchPurchaseRequestStatuses() {
  const response = await api.get('/purchase-requests/statuses');
  return response.data;
}

/**
 * Dispatch all PENDING_DISPATCH purchase requests to supplier orders
 * @returns {Promise<Object>} { dispatched_count, created_orders, errors, details }
 */
export async function dispatchPurchaseRequests() {
  const response = await api.post('/purchase-requests/dispatch');
  return response.data;
}

/**
 * Récupère les colonnes détectées par le backend pour un fichier CSV
 * @param {File} file - Fichier CSV
 * @returns {Promise<{ headers: string[], separator: string, header_row_index: number }>}
 */
export async function fetchCsvImportHeaders(file) {
  const form = new FormData();
  form.append('file', file);
  const response = await api.post('/purchase-requests/import/headers', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

/**
 * Importer des DA depuis un fichier CSV
 * @param {File} file - Fichier CSV
 * @param {string} interventionId - UUID de l'intervention cible
 * @param {string} colRef - Nom de la colonne référence
 * @param {string} colQty - Nom de la colonne quantité
 * @param {string} [urgency='normal'] - Urgence globale
 * @param {boolean} [dryRun=false] - Analyse sans créer (aperçu)
 * @param {number[]} [excludedRows=[]] - Numéros de lignes à ignorer (1-based)
 * @returns {Promise<{ total, created, skipped, errors, lines }>}
 */
export async function importPurchaseRequestsCsv(
  file,
  interventionId,
  colRef,
  colQty,
  urgency = 'normal',
  dryRun = false,
  excludedRows = []
) {
  const form = new FormData();
  form.append('file', file);
  form.append('intervention_id', interventionId);
  form.append('col_ref', colRef);
  form.append('col_qty', colQty);
  form.append('urgency', urgency);
  form.append('dry_run', dryRun ? 'true' : 'false');
  form.append('excluded_rows', excludedRows.join(','));
  const response = await api.post('/purchase-requests/import', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}
