import { api } from '@/lib/api/client';

export async function fetchInterventionTasksList(params = {}) {
  const res = await api.get('/intervention-tasks', { params });
  return res.data.items ?? [];
}

export async function fetchInterventionTasks(intervention_id) {
  const res = await api.get('/intervention-tasks', {
    params: { intervention_id, include_done: true },
  });
  const items = res.data.items ?? [];
  return items.flatMap((item) => Array.isArray(item.tasks) ? item.tasks : []);
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
  const res = await api.get('/intervention-actions', { params: { task_id } });
  return res.data.data ?? [];
}

export async function createInterventionActionForTask(data) {
  const res = await api.post('/intervention-actions', data);
  return res.data.data ?? {};
}
