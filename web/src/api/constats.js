/**
 * Constat après intervention (ADR 0043) : appels HTTP bruts, la forme vient du backend.
 */
import { api } from '@/lib/api/client';

const asList = (r) => (Array.isArray(r.data) ? r.data : []);

export async function fetchConstatQuestions() {
  return asList(await api.get('/constats/questions'));
}

export async function fetchInterventionConstats(interventionId) {
  return asList(await api.get(`/interventions/${interventionId}/constats`));
}

export async function fetchConstatByRequest(requestId) {
  return asList(await api.get(`/constats/by-request/${requestId}`));
}

/** @param {{choices: string[], machine_id?: string|null}} payload */
export async function createConstat(interventionId, payload) {
  const r = await api.post(`/interventions/${interventionId}/constats`, payload);
  return r.data;
}

/** Le motif manquant (400 + audit.reasons) est demandé par la fenêtre commune (auditGuard). */
export async function correctConstat(constatId, payload) {
  const r = await api.post(`/constats/${constatId}/corrections`, payload);
  return r.data;
}

export async function fetchImprovementIdeas(constatId) {
  return asList(await api.get(`/constats/${constatId}/improvement-ideas`));
}

export async function linkConstat(constatId, requestId) {
  const r = await api.post(`/constats/${constatId}/link`, { request_id: requestId });
  return r.data;
}
