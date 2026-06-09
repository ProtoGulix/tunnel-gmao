import { api } from '@/lib/api/client';
import { mapInterventionResponse, mapInterventionDetailResponse } from './interventionMappers';

export async function fetchInterventions(filters = {}) {
  const params = {
    skip: filters.skip ?? 0,
    limit: filters.limit ?? 1000,
  };
  if (filters.equipementId) params.equipement_id = filters.equipementId;
  if (filters.status) params.status = filters.status;
  if (filters.priority) params.priority = filters.priority;
  if (filters.sort) params.sort = filters.sort;
  if (filters.include) params.include = filters.include;

  const response = await api.get('/interventions', { params });
  const items = response.data.items ?? [];
  return items.map(mapInterventionResponse);
}

export async function fetchIntervention(id) {
  const response = await api.get(`/interventions/${id}`);
  return mapInterventionDetailResponse(response.data.data);
}

export async function fetchInterventionFacets(id) {
  const response = await api.get(`/interventions/${id}`);
  const data = response.data.data ?? {};
  return {
    subcategories: data.facets?.action_categories ?? [],
    complexityFactors: data.facets?.complexity_factors ?? [],
  };
}

export async function createIntervention(data) {
  const payload = {
    machine_id: data.equipementId,
    type_inter: data.type,
    tech_id: data.techId,
    title: data.title,
    priority: data.priority,
    status_actual: 'ouvert',
    reported_date: data.reportedDate
      ? new Date(data.reportedDate).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
  };
  if (data.reportedBy) payload.reported_by = data.reportedBy;
  if (data.requestId) payload.request_id = data.requestId;
  if (data.reasonCode) payload.reason_code = data.reasonCode;
  const response = await api.post('/interventions', payload);
  return mapInterventionResponse(response.data?.data ?? response.data);
}

export async function updateIntervention(id, updates) {
  const payload = {};
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.printedFiche !== undefined) payload.printed_fiche = updates.printedFiche;
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.status !== undefined) payload.status_actual = updates.status;
  if (updates.reason_code !== undefined) payload.reason_code = updates.reason_code;
  if (updates.reason_text !== undefined) payload.reason_text = updates.reason_text;

  const response = await api.put(`/interventions/${id}`, payload);
  return mapInterventionDetailResponse(response.data.data);
}

export async function updateInterventionStatus(id, newStatus, reasonCode, reasonText) {
  return updateIntervention(id, { status: newStatus, reason_code: reasonCode, reason_text: reasonText });
}

export async function deleteIntervention(id) {
  await api.delete(`/interventions/${id}`);
}

export async function fetchInterventionPdf(id) {
  const response = await api.get(`/exports/interventions/${id}/pdf`, {
    responseType: 'blob',
  });
  const blob = new Blob([response.data], { type: 'application/pdf' });
  return window.URL.createObjectURL(blob);
}
