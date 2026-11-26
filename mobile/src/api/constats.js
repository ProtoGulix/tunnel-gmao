import { client } from "../lib/api/client";

// Questions et choix du constat (référentiel en base, ADR 0043).
export function getConstatQuestions() {
  return client.get("/constats/questions").then((res) => (Array.isArray(res) ? res : (res.items ?? [])));
}

export function getInterventionConstats(interventionId) {
  return client
    .get(`/interventions/${interventionId}/constats`)
    .then((res) => (Array.isArray(res) ? res : (res.items ?? [])));
}

/**
 * Crée un constat et sa demande d'intervention.
 * @param {string} interventionId
 * @param {{ choices: string[], machine_id?: string|null }} data
 */
export function createConstat(interventionId, data) {
  return client.post(`/interventions/${interventionId}/constats`, data);
}
