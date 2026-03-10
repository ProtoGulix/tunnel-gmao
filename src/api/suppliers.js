/**
 * @fileoverview Fournisseurs API
 * @module api/suppliers
 */

import { api } from '@/lib/api/client';

export async function fetchSuppliers(params = {}) {
  const response = await api.get('/suppliers/', { params });
  return response.data || [];
}

export async function fetchSupplierDetail(id) {
  const response = await api.get(`/suppliers/${id}`);
  return response.data || null;
}

export async function createSupplier(payload) {
  const response = await api.post('/suppliers', payload);
  return response.data || null;
}

export async function updateSupplier(id, updates) {
  const response = await api.put(`/suppliers/${id}`, updates);
  return response.data || null;
}

export async function deleteSupplier(id) {
  await api.delete(`/suppliers/${id}`);
}

// --- Liaisons fournisseur-pièce ---

export async function fetchSupplierItemLinks(supplierId) {
  const response = await api.get(`/stock-item-suppliers/supplier/${supplierId}`);
  return response.data || [];
}

export async function fetchStockItemSupplierLinks(stockItemId) {
  const response = await api.get(`/stock-item-suppliers/stock-item/${stockItemId}`);
  return response.data || [];
}

export async function createSupplierItemLink(payload) {
  const response = await api.post('/stock-item-suppliers', payload);
  return response.data || null;
}

export async function updateSupplierItemLink(id, updates) {
  const response = await api.put(`/stock-item-suppliers/${id}`, updates);
  return response.data || null;
}

export async function deleteSupplierItemLink(id) {
  await api.delete(`/stock-item-suppliers/${id}`);
}

export async function setPreferredSupplierItemLink(id) {
  const response = await api.post(`/stock-item-suppliers/${id}/set-preferred`);
  return response.data || null;
}
