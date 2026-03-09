/**
 * Configuration UI du module Achats
 *
 * Centralise les labels, couleurs et listes des statuts et niveaux d'urgence
 * utilisés pour l'affichage (badges, onglets, filtres).
 *
 * Note : les statuts commande fournisseur viennent de GET /supplier-orders/statuses
 * via useSupplierOrderStatuses() — ne pas les hardcoder ici.
 */

// Génère le style inline pour un Badge avec couleur hexadécimale retournée par le backend
export function hexBadgeStyle(hexColor) {
  if (!hexColor?.startsWith('#')) return null;
  return { background: hexColor + '22', color: hexColor, border: `1px solid ${hexColor}44` };
}

// Niveaux d'urgence des demandes d'achat — map indexée par code backend
export const PURCHASE_URGENCY = {
  normal: { label: 'Normal', color: 'gray' },
  high: { label: 'Haute', color: 'orange' },
  critical: { label: 'Critique', color: 'red' },
};

// Liste ordonnée pour les filtres (select)
export const PURCHASE_URGENCY_LIST = [
  { value: 'normal', ...PURCHASE_URGENCY.normal },
  { value: 'high', ...PURCHASE_URGENCY.high },
  { value: 'critical', ...PURCHASE_URGENCY.critical },
];

// Couleurs Radix des statuts d'intervention — affichés dans les fiches DA
export const INTERVENTION_STATUS_COLORS = {
  ouvert: 'blue',
  en_cours: 'blue',
  attente_pieces: 'red',
  attente_prod: 'amber',
  termine: 'green',
  cloture: 'gray',
  annule: 'gray',
};
