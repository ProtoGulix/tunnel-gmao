import { PRIORITY_CONFIG } from '../config/interventionTypes.js';

// Urgences d'une demande, de la plus faible à la plus forte (libellés : PRIORITY_CONFIG)
export const REQUEST_PRIORITIES = ['faible', 'normal', 'important', 'urgent'].map((code) => ({
  code,
  label: PRIORITY_CONFIG[code].label,
}));

// Statuts où l'API accepte encore un changement d'urgence (masque l'inutile, l'API tranche)
const EDITABLE_STATUSES = ['nouvelle', 'en_attente'];

export function isPriorityEditable(statut) {
  return EDITABLE_STATUSES.includes(statut);
}
