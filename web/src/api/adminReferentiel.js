/**
 * API Admin — Référentiel (catégories, sous-catégories, facteurs, types, statuts)
 * @module api/adminReferentiel
 */

import { api } from '@/lib/api/client';

// --- Catégories d'actions ---
export async function fetchActionCategories() {
  const r = await api.get('/admin/action-categories');
  return r.data;
}
export async function updateActionCategory(id, data) {
  const r = await api.patch(`/admin/action-categories/${id}`, data);
  return r.data;
}

// --- Sous-catégories d'actions ---
export async function fetchActionSubcategories() {
  const r = await api.get('/admin/action-subcategories');
  return r.data;
}
export async function createActionSubcategory(data) {
  const r = await api.post('/admin/action-subcategories', data);
  return r.data;
}
export async function updateActionSubcategory(id, data) {
  const r = await api.patch(`/admin/action-subcategories/${id}`, data);
  return r.data;
}

// --- Facteurs de complexité ---
export async function fetchComplexityFactors() {
  const r = await api.get('/admin/complexity-factors');
  return r.data;
}

// --- Types d'intervention ---
export async function fetchInterventionTypes() {
  const r = await api.get('/admin/intervention-types');
  return r.data;
}
export async function createInterventionType(data) {
  const r = await api.post('/admin/intervention-types', data);
  return r.data;
}
export async function updateInterventionType(id, data) {
  const r = await api.patch(`/admin/intervention-types/${id}`, data);
  return r.data;
}
export async function toggleInterventionTypeActive(id, is_active) {
  const r = await api.patch(`/admin/intervention-types/${id}/active`, { is_active });
  return r.data;
}

// --- Statuts d'intervention ---
export async function fetchInterventionStatuses() {
  const r = await api.get('/admin/intervention-statuses');
  return r.data;
}
export async function updateInterventionStatus(id, data) {
  const r = await api.patch(`/admin/intervention-statuses/${id}`, data);
  return r.data;
}

// --- Classes d'équipement ---
export async function fetchEquipementClasses() {
  const r = await api.get('/equipement-class');
  return r.data;
}
export async function createEquipementClass(data) {
  const r = await api.post('/equipement-class', data);
  return r.data;
}
export async function updateEquipementClass(id, data) {
  const r = await api.patch(`/equipement-class/${id}`, data);
  return r.data;
}
export async function fetchClassInterventionTypes(id) {
  const r = await api.get(`/equipement-class/${id}/intervention-types`);
  return r.data?.data?.intervention_types ?? [];
}
export async function replaceClassInterventionTypes(id, interventionTypes) {
  const r = await api.put(`/equipement-class/${id}/intervention-types`, { intervention_types: interventionTypes });
  return r.data?.data ?? r.data;
}
export async function deleteEquipementClass(id) {
  const r = await api.delete(`/equipement-class/${id}`);
  return r.data;
}

// --- Constats : questions et choix (ADR 0045) ---
export async function fetchConstatQuestions() {
  const r = await api.get('/admin/constat-questions');
  return r.data;
}
export async function updateConstatQuestion(id, data) {
  const r = await api.patch(`/admin/constat-questions/${id}`, data);
  return r.data;
}
export async function createConstatChoice(data) {
  const r = await api.post('/admin/constat-choices', data);
  return r.data;
}
export async function updateConstatChoice(id, data) {
  const r = await api.patch(`/admin/constat-choices/${id}`, data);
  return r.data;
}
