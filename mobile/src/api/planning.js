import { client } from "../lib/api/client";

export function getActions(params = {}) {
  const query = new URLSearchParams(params).toString();
  return client.get(`/intervention-actions${query ? `?${query}` : ""}`).then(res => Array.isArray(res) ? res : (res.items ?? res))
}

export function createAction(data) {
  return client.post("/intervention-actions", data);
}

export function searchInterventions(params = {}) {
  const query = new URLSearchParams({ limit: 20, ...params }).toString();
  return client.get(`/interventions?${query}`).then((res) => res.items ?? res);
}

export function getActionCategories() {
  return client.get("/action-categories").then(res => Array.isArray(res) ? res : (res.items ?? res))
}

export function getComplexityFactors() {
  return client.get("/complexity-factors").then(res => Array.isArray(res) ? res : (res.items ?? res))
}

export function createIntervention(data) {
  return client.post("/interventions", data);
}

export function createDI(data) {
  return client.post("/intervention-requests", data);
}

export function searchDI(params = {}) {
  const query = new URLSearchParams({
    exclude_statuses: "rejetee,cloturee",
    limit: 30,
    ...params,
  }).toString();
  return client
    .get(`/intervention-requests?${query}`)
    .then((res) => res.items ?? res);
}

// includeInactive : pour l'affichage des interventions existantes (types retirés inclus) ;
// sans, seuls les types actifs sont renvoyés (création).
// machineId : limite aux types permis pour l'équipement (classe, ADR 0031) ; sans, liste inchangée.
export function getInterventionTypes({ includeInactive = false, machineId = null } = {}) {
  const params = new URLSearchParams()
  if (includeInactive) params.set("include_inactive", "true")
  if (machineId) params.set("machine_id", machineId)
  const query = params.size ? `?${params}` : ""
  return client.get(`/interventions/types${query}`).then(res => Array.isArray(res) ? res : (res.items ?? res))
}

// Techniciens actifs, pour choisir le pilote d'une intervention à la création.
export function getActiveUsers() {
  return client.get("/users?status=active").then(res => Array.isArray(res) ? res : (res.items ?? []))
}
