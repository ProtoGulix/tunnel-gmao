/**
 * @fileoverview API Plans préventifs
 * @module api/preventivePlans
 */

import { api } from '@/lib/api/client';

export async function fetchPreventivePlans({ active_only = true } = {}) {
  const res = await api.get('/preventive-plans', { params: { active_only } });
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchPreventivePlan(id) {
  const res = await api.get(`/preventive-plans/${id}`);
  return res.data;
}

export async function createPreventivePlan(data) {
  const res = await api.post('/preventive-plans', data);
  return res.data;
}

export async function updatePreventivePlan(id, data) {
  const res = await api.put(`/preventive-plans/${id}`, data);
  return res.data;
}

export async function deletePreventivePlan(id) {
  await api.delete(`/preventive-plans/${id}`);
}

export async function patchPreventivePlanSteps(id, steps) {
  const res = await api.patch(`/preventive-plans/${id}/steps`, steps);
  return res.data;
}
