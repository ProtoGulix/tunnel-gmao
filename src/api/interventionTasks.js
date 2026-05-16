import { api } from '@/lib/api/client';
import { storeAuditReasons } from '@/lib/auditReasonsCache';

export async function fetchInterventionTasksList(params = {}) {
  const res = await api.get('/intervention-tasks', { params });
  const raw = res.data;
  if (Array.isArray(raw?.audit?.reasons)) storeAuditReasons(raw.audit.reasons);
  // Ancien format tableau plat
  if (Array.isArray(raw)) return raw;
  // Nouveau format { items, pagination, audit } — items est un tableau d'interventions
  if (Array.isArray(raw?.items)) return raw.items;
  return raw?.data || [];
}

export async function fetchInterventionTasks(intervention_id) {
  const res = await api.get('/intervention-tasks', {
    params: { intervention_id, include_done: true },
  });
  const raw = res.data;
  if (Array.isArray(raw?.audit?.reasons)) storeAuditReasons(raw.audit.reasons);
  // Nouveau format { items, pagination, audit } — items[0].tasks contient les tâches
  if (Array.isArray(raw?.items)) {
    return raw.items.flatMap((item) => Array.isArray(item.tasks) ? item.tasks : []);
  }
  if (Array.isArray(raw)) return raw;
  return raw?.data || [];
}

export async function fetchInterventionTasksByOccurrence(occurrence_id) {
  return fetchInterventionTasksList({ occurrence_id, include_done: true });
}

export async function fetchTasksProgress(params) {
  const res = await api.get('/intervention-tasks/progress', { params });
  return res.data;
}

export async function fetchInterventionTasksProgress(intervention_id) {
  return fetchTasksProgress({ intervention_id });
}

export async function fetchInterventionTasksProgressByOccurrence(occurrence_id) {
  return fetchTasksProgress({ occurrence_id });
}

export async function createInterventionTask(data) {
  const res = await api.post('/intervention-tasks', data);
  return res.data;
}

export async function patchInterventionTask(id, data) {
  const res = await api.patch(`/intervention-tasks/${id}`, data);
  return res.data;
}

export async function updateInterventionTask(id, data) {
  return patchInterventionTask(id, data);
}

export async function fetchInterventionTaskActions(task_id) {
  const res = await api.get('/intervention-actions', {
    params: { task_id },
  });
  return Array.isArray(res.data) ? res.data : res.data?.data || [];
}

export async function createInterventionActionForTask(data) {
  const res = await api.post('/intervention-actions', data);
  return res.data?.data || res.data || {};
}
