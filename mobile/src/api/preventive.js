import { client } from "../lib/api/client";

// Échéancier : tableau brut. Le backend calcule l'état, le client ne fait que filtrer.
export function getSchedule(state) {
  return client
    .get(`/preventive-occurrences/schedule?state=${state}`)
    .then((res) => (Array.isArray(res) ? res : (res?.items ?? [])));
}
