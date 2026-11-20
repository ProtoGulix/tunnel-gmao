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

/**
 * Ignore une occurrence. Aucun motif dans l'appel : le backend répond 400 avec la liste des
 * motifs, la fenêtre de motif commune (auditGuard) le demande puis relance la requête.
 */
export async function skipPreventiveOccurrence(id) {
  const res = await api.patch(`/preventive-occurrences/${id}/skip`, {});
  return res.data;
}

export async function generatePreventiveOccurrences() {
  const res = await api.post('/preventive-occurrences/generate');
  return res.data;
}

export async function repairPreventiveOccurrences() {
  const res = await api.post('/preventive-occurrences/repair');
  return res.data;
}

/** Échéancier : une ligne par plan actif et machine ; l'état (retard, à venir) est calculé par la route. */
export async function fetchPreventiveSchedule({ machine_id, include_descendants, state } = {}) {
  const params = {};
  if (machine_id) params.machine_id = machine_id;
  if (include_descendants) params.include_descendants = true;
  if (state) params.state = state;
  const res = await api.get('/preventive-occurrences/schedule', { params });
  return Array.isArray(res.data) ? res.data : [];
}

/** Historique d'une machine : une ligne par occurrence, avec l'écart d'échéance (delta_days). */
export async function fetchPreventiveHistory(machine_id) {
  const res = await api.get('/preventive-occurrences/history', { params: { machine_id } });
  return Array.isArray(res.data?.items) ? res.data.items : [];
}

/** Lance tout de suite l'occurrence d'un plan à périodicité, sans attendre la prévenance. */
export async function anticipatePreventiveOccurrence(plan_id, machine_id) {
  const res = await api.post('/preventive-occurrences/anticipate', { plan_id, machine_id });
  return res.data;
}
