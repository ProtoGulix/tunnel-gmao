/**
 * @fileoverview API Occurrences préventives
 * @module api/preventiveOccurrences
 */

import { api } from '@/lib/api/client';

export async function fetchPreventiveOccurrences({ plan_id, machine_id, status, scheduled_date_from, scheduled_date_to } = {}) {
  const params = {};
  if (plan_id) params.plan_id = plan_id;
  if (machine_id) params.machine_id = machine_id;
  if (status) params.status = status;
  if (scheduled_date_from) params.scheduled_date_from = scheduled_date_from;
  if (scheduled_date_to) params.scheduled_date_to = scheduled_date_to;
  const res = await api.get('/preventive-occurrences', { params });
  return Array.isArray(res.data) ? res.data : [];
}

export async function skipPreventiveOccurrence(id, skip_reason) {
  const res = await api.patch(`/preventive-occurrences/${id}/skip`, { skip_reason });
  return res.data;
}

export async function generatePreventiveOccurrences() {
  const res = await api.post('/preventive-occurrences/generate');
  return res.data;
}
