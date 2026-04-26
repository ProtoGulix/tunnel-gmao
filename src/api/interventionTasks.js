import { api } from '@/lib/api/client';

export async function fetchInterventionTasks(intervention_id) {
  const res = await api.get('/intervention-tasks', { params: { intervention_id, include_done: true } });
  return Array.isArray(res.data) ? res.data : [];
}

export async function fetchInterventionTasksByOccurrence(occurrence_id) {
  const res = await api.get('/intervention-tasks', { params: { occurrence_id, include_done: true } });
  return Array.isArray(res.data) ? res.data : [];
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

export async function patchInterventionTask(id, data) {
  const res = await api.patch(`/intervention-tasks/${id}`, data);
  return res.data;
}
