/**
 * @fileoverview API Validations étapes de gamme
 * @module api/gammeStepValidations
 */

import { api } from '@/lib/api/client';

export async function fetchGammeStepValidations(intervention_id) {
  const res = await api.get('/gamme-step-validations', { params: { intervention_id } });
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchGammeProgress(intervention_id) {
  const res = await api.get('/gamme-step-validations/progress', { params: { intervention_id } });
  return res.data;
}

export async function patchGammeStepValidation(id, data) {
  const res = await api.patch(`/gamme-step-validations/${id}`, data);
  return res.data;
}
