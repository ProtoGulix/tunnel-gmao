import { client } from '../lib/api/client'

/**
 * Tâches assignées à un technicien, non closes (todo + in_progress),
 * groupées par intervention côté backend (voir GET /intervention-tasks).
 * Aplatit items[].tasks en gardant une référence _intervention pour le
 * contexte (code, titre, équipement) — pattern identique à tunnel-gmao.
 *
 * @param {string} userId — UUID du technicien
 * @returns {Promise<Array>}
 */
export async function getMyTasks(userId) {
  const query = new URLSearchParams({
    assigned_to: userId,
    status: 'todo,in_progress',
    limit: '100',
  }).toString()
  const res = await client.get(`/intervention-tasks?${query}`)
  const items = res.items ?? []
  return items.flatMap((item) =>
    (Array.isArray(item.tasks) ? item.tasks : []).map((task) => ({
      ...task,
      _intervention: {
        id: item.id,
        code: item.code,
        title: item.title,
        status: item.status,
        equipement: item.equipement,
      },
    }))
  )
}

/**
 * Tâches ouvertes (todo + in_progress) d'une intervention donnée — utilisé
 * pour rattacher une action à une tâche existante (ActionForm).
 *
 * @param {string} interventionId
 * @returns {Promise<Array>}
 */
export async function getOpenTasksByIntervention(interventionId) {
  const query = new URLSearchParams({
    intervention_id: interventionId,
    status: 'todo,in_progress',
    limit: '100',
  }).toString()
  const res = await client.get(`/intervention-tasks?${query}`)
  const items = res.items ?? []
  return items.flatMap((item) => (Array.isArray(item.tasks) ? item.tasks : []))
}

/**
 * Toutes les tâches d'une intervention (gamme + manuelles, y compris
 * done/skipped) — utilisé par l'onglet "Tâches" du détail d'intervention.
 * Pattern identique à fetchInterventionTasks côté tunnel-gmao.
 *
 * @param {string} interventionId
 * @returns {Promise<Array>}
 */
export async function getAllTasksByIntervention(interventionId) {
  const query = new URLSearchParams({
    intervention_id: interventionId,
    include_done: 'true',
  }).toString()
  const res = await client.get(`/intervention-tasks?${query}`)
  const items = res.items ?? []
  return items.flatMap((item) => (Array.isArray(item.tasks) ? item.tasks : []))
}

/**
 * Progression des tâches d'une intervention — { total, todo, in_progress,
 * done, skipped, blocking_pending, is_complete }.
 *
 * @param {string} interventionId
 * @returns {Promise<Object>}
 */
export function getTasksProgress(interventionId) {
  return client.get(`/intervention-tasks/progress?intervention_id=${interventionId}`)
}

/**
 * Crée une tâche manuelle (origin='tech') sur une intervention.
 *
 * @param {{ interventionId: string, label: string, assignedTo?: string, dueDate?: string, optional?: boolean }} params
 * @returns {Promise<Object>} la tâche créée
 */
export function createTask({ interventionId, label, assignedTo, dueDate, optional }) {
  return client.post('/intervention-tasks', {
    intervention_id: interventionId,
    label,
    origin: 'tech',
    assigned_to: assignedTo || undefined,
    due_date: dueDate || undefined,
    optional: optional ?? false,
    reason_code: 'ROUTINE',
  })
}

/**
 * Met à jour une tâche (statut, libellé, assignation, échéance...).
 * `skip_reason` obligatoire si `updates.status === 'skipped'` (validé côté
 * backend) — à fournir par l'appelant, jamais envoyer status=skipped sans.
 *
 * @param {string} taskId
 * @param {Object} updates
 * @returns {Promise<Object>} la tâche mise à jour
 */
export function updateTask(taskId, updates) {
  return client.patch(`/intervention-tasks/${taskId}`, { ...updates, reason_code: 'ROUTINE' })
}

/**
 * Supprime une tâche.
 * @param {string} taskId
 */
export function deleteTask(taskId) {
  return client.delete(`/intervention-tasks/${taskId}`, { body: JSON.stringify({ reason_code: 'ROUTINE' }) })
}
