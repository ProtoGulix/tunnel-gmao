/**
 * API Admin — Référentiel (catégories, sous-catégories, facteurs, types, statuts)
 * @module api/adminReferentiel
 */

import { api } from '@/lib/api/client';

// --- Catégories d'actions ---
export async function fetchActionCategories() {
  const r = await api.get('/admin/action-categories');
  return r.data?.data || r.data;
}
export async function updateActionCategory(id, data) {
  const r = await api.patch(`/admin/action-categories/${id}`, data);
  return r.data?.data || r.data;
}
export async function toggleActionCategoryActive(id, is_active) {
  const r = await api.patch(`/admin/action-categories/${id}/active`, { is_active });
  return r.data?.data || r.data;
}

// --- Sous-catégories d'actions ---
export async function fetchActionSubcategories() {
  const r = await api.get('/admin/action-subcategories');
  return r.data?.data || r.data;
}
export async function createActionSubcategory(data) {
  const r = await api.post('/admin/action-subcategories', data);
  return r.data?.data || r.data;
}
export async function updateActionSubcategory(id, data) {
  const r = await api.patch(`/admin/action-subcategories/${id}`, data);
  return r.data?.data || r.data;
}
export async function toggleActionSubcategoryActive(id, is_active) {
  const r = await api.patch(`/admin/action-subcategories/${id}/active`, { is_active });
  return r.data?.data || r.data;
}

// --- Facteurs de complexité ---
export async function fetchComplexityFactors() {
  const r = await api.get('/admin/complexity-factors');
  return r.data?.data || r.data;
}
export async function updateComplexityFactor(id, data) {
  const r = await api.patch(`/admin/complexity-factors/${id}`, data);
  return r.data?.data || r.data;
}
export async function toggleComplexityFactorActive(id, is_active) {
  const r = await api.patch(`/admin/complexity-factors/${id}/active`, { is_active });
  return r.data?.data || r.data;
}

// --- Types d'intervention ---
export async function fetchInterventionTypes() {
  const r = await api.get('/admin/intervention-types');
  return r.data?.data || r.data;
}
export async function createInterventionType(data) {
  const r = await api.post('/admin/intervention-types', data);
  return r.data?.data || r.data;
}
export async function updateInterventionType(id, data) {
  const r = await api.patch(`/admin/intervention-types/${id}`, data);
  return r.data?.data || r.data;
}
export async function toggleInterventionTypeActive(id, is_active) {
  const r = await api.patch(`/admin/intervention-types/${id}/active`, { is_active });
  return r.data?.data || r.data;
}

// --- Statuts d'intervention ---
export async function fetchInterventionStatuses() {
  const r = await api.get('/admin/intervention-statuses');
  return r.data?.data || r.data;
}
export async function updateInterventionStatus(id, data) {
  const r = await api.patch(`/admin/intervention-statuses/${id}`, data);
  return r.data?.data || r.data;
}
