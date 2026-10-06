import { api } from '@/lib/api/client';

export async function fetchInterventionTasksList(params = {}) {
  const res = await api.get('/intervention-tasks', { params });
  return res.data.items ?? [];
}

/**
 * Tâches ouvertes (todo + in_progress) pour un équipement donné, toutes interventions confondues.
 * Aplatit items[].tasks et trie in_progress en premier.
 * @param {string} machineId — UUID de l'équipement
 * @returns {Promise<Array>}
 */
export async function fetchOpenTasksByMachine(machineId) {
  const res = await api.get('/intervention-tasks', {
    params: { machine_id: machineId, status: 'todo,in_progress', limit: 100 },
  });
  const items = res.data.items ?? [];
  const flat = items.flatMap((item) =>
    (Array.isArray(item.tasks) ? item.tasks : []).map((task) => ({
      ...task,
      _intervention: { id: item.id, code: item.code, title: item.title, status: item.status, equipement: item.equipement },
    }))
  );
  flat.sort((a, b) => {
    if (a.status === b.status) return 0;
    if (a.status === 'in_progress') return -1;
    return 1;
  });
  return flat;
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

export async function deleteInterventionTask(id) {
  // Le body est requis pour le reason_code (géré par auditGuard sur 422)
  await api.delete(`/intervention-tasks/${id}`, { data: {} });
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
