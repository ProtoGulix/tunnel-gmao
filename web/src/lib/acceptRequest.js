/**
 * Règles pures de l'acceptation d'une demande par le formulaire standard de création.
 * @module lib/acceptRequest
 */
import { REQUEST_PRIORITIES } from './requestPriority.js';

const DEFAULT_PRIORITY = 'normal';

/** Priorité préremplie : l'urgence de la demande si elle est connue, sinon normale. */
export function initialPriority(request) {
  const codes = REQUEST_PRIORITIES.map((p) => p.code);
  return codes.includes(request?.priorite) ? request.priorite : DEFAULT_PRIORITY;
}

/** Contexte de InterventionCreationPanel pour une demande déjà choisie, ou null sans équipement. */
export function buildAcceptContext(request, { onCreated, onCancel }) {
  const eq = request?.equipement;
  if (!eq?.id) return null;
  return {
    equipementId: eq.id,
    equipementLabel: `${eq.code ?? ''} — ${eq.name ?? ''}`.trim(),
    selectedRequest: request,
    onCreated,
    onCancel,
  };
}
