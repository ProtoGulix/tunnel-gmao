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
  })
}

/**
 * Met à jour une tâche (statut, libellé, assignation, échéance...).
 *
 * Aucun motif n'est codé ici : le backend applique seul la règle routinière.
 * Quand un motif est exigé (ex. passage vers `skipped`), il répond 400 avec la
 * liste des motifs (`error.data.audit.reasons`) ; l'appelant renvoie alors la
 * requête avec `audit` = { reason_code, reason_text? } choisi dans la feuille.
 *
 * @param {string} taskId
 * @param {Object} updates
 * @param {{ reason_code: string, reason_text?: string }} [audit] motif choisi
 * @returns {Promise<Object>} la tâche mise à jour
 */
export function updateTask(taskId, updates, audit) {
  return client.patch(`/intervention-tasks/${taskId}`, { ...updates, ...(audit ?? {}) })
}

/**
 * Supprime une tâche. Un motif de suppression est obligatoire : il vient de
 * AuditReasonSheet (motifs `deleted`), jamais d'une valeur codée en dur.
 *
 * @param {string} taskId
 * @param {{ reason_code: string, reason_text?: string }} audit motif choisi
 */
export function deleteTask(taskId, audit) {
  return client.delete(`/intervention-tasks/${taskId}`, { body: JSON.stringify(audit) })
}
