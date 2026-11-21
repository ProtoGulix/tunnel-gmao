import { client } from "../lib/api/client";

export function getInterventionRequests(params = {}) {
  const query = new URLSearchParams(params).toString();
  return client.get(`/intervention-requests${query ? `?${query}` : ""}`);
}

export function getInterventionRequest(id) {
  return client.get(`/intervention-requests/${id}`);
}

export function createInterventionRequest(data) {
  return client.post("/intervention-requests", data);
}

export function transitionInterventionRequest(id, data) {
  return client.post(`/intervention-requests/${id}/transition`, data);
}

export function getEquipements(search = "") {
  return client
    .get(`/equipements${search ? `?search=${encodeURIComponent(search)}` : ""}`)
    .then((res) => res.items ?? res);
}

export function getIntervention(id) {
  return client.get(`/interventions/${id}`);
}

export function searchInterventions(params = {}, options = {}) {
  const query = new URLSearchParams({ limit: 50, ...params }).toString();
  return client
    .get(`/interventions?${query}`, options)
    .then((res) => res.items ?? res);
}

export function getInterventionActions(interventionId) {
  return client
    .get(`/intervention-actions?intervention_id=${interventionId}`)
    .then((res) => res.items ?? res);
}

export function changeInterventionStatus(data) {
  return client.post("/intervention-status-log", data);
}

/**
 * Clôt une intervention : même route que le web (PUT /interventions/{id},
 * status_actual = 'ferme'). Le backend applique ses règles (tâches bloquantes,
 * gamme) et, si les règles d'audit l'exigent, répond 400 avec les motifs
 * (`error.data.audit.reasons`) ; l'appelant renvoie alors avec `audit`.
 *
 * @param {string} interventionId
 * @param {{ reason_code: string, reason_text?: string }} [audit] motif choisi
 */
export function closeIntervention(interventionId, audit) {
  return client.put(`/interventions/${interventionId}`, { status_actual: "ferme", ...(audit ?? {}) });
}

/**
 * Rouvre une intervention fermée vers `statusCode` : même route que la clôture
 * (PUT /interventions/{id}, ADR 0028). Le backend exige un motif ; sans motif il répond
 * 400 avec les motifs proposés (`error.data.audit.reasons`), l'appelant renvoie avec `audit`.
 *
 * @param {string} interventionId
 * @param {string} statusCode statut visé (hors 'ferme')
 * @param {{ reason_code: string, reason_text?: string }} [audit] motif choisi
 */
export function reopenIntervention(interventionId, statusCode, audit) {
  return client.put(`/interventions/${interventionId}`, { status_actual: statusCode, ...(audit ?? {}) });
}

export function getInterventionStatuses() {
  return client.get("/intervention-status");
}

export function getServices() {
  return client.get("/services");
}
