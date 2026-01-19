export const INTERVENTION_TYPES = [
  { id: 'CUR', title: 'Curatif', color: 'red' }, // Rouge bloqué
  { id: 'PRE', title: 'Préventif', color: 'green' }, // Vert OK
  { id: 'REA', title: 'Réapprovisionnement', color: 'blue' }, // Bleu primaire
  { id: 'BAT', title: 'Batiment', color: 'gray' },
  { id: 'PRO', title: 'Projet', color: 'blue' }, // Bleu primaire
  { id: 'COF', title: 'Remise en conformité', color: 'amber' }, // Orange attente
  { id: 'PIL', title: 'Pilotage', color: 'blue' }, // Bleu primaire
  { id: 'MES', title: 'Mise en service', color: 'amber' }, // Orange attente
];

export const STATUS_CONFIG = {
  ouvert: { color: 'blue', label: 'Ouvert', bg: 'var(--blue-3)' }, // Bleu = en cours
  attente_prod: {
    color: 'amber', // Orange = attente
    label: 'Attente production',
    bg: 'var(--amber-3)',
  },
  ferme: { color: 'green', label: 'Fermé', bg: 'var(--green-3)' }, // Vert = clôturé
  attente_pieces: { color: 'red', label: 'Attente pièces', bg: 'var(--red-3)' }, // Rouge = bloqué
  cancelled: { color: 'gray', label: 'Annulé', bg: 'var(--gray-3)' },
};

export const PRIORITY_CONFIG = {
  urgent: { color: 'red' }, // Rouge = bloqué/critique
  important: { color: 'amber' }, // Orange = attente/important
  normal: { color: 'blue' }, // Bleu = normal
  faible: { color: 'gray' }, // Gris = faible priorité
};

/**
 * COULEURS D'ÉTAT DE L'INTERVENTION
 * Utilisé pour les boutons de statut avec états actif/hover/inactif
 * Structure: { label, activeBg, hoverBg, inactiveBg, textActive, textInactive }
 */
export const STATE_COLORS = {
  ouvert: {
    label: 'En cours',
    activeBg: 'var(--blue-9)', // Bleu industriel
    hoverBg: 'var(--blue-7)',
    inactiveBg: 'var(--gray-3)',
    textActive: 'white',
    textInactive: 'var(--gray-10)',
  },
  attente_pieces: {
    label: 'Attente pièces',
    activeBg: 'var(--red-9)', // Rouge bloqué
    hoverBg: 'var(--red-7)',
    inactiveBg: 'var(--gray-3)',
    textActive: 'white',
    textInactive: 'var(--gray-10)',
  },
  attente_prod: {
    label: 'Attente prod.',
    activeBg: 'var(--amber-9)', // Orange attente
    hoverBg: 'var(--amber-7)',
    inactiveBg: 'var(--gray-3)',
    textActive: 'white',
    textInactive: 'var(--gray-10)',
  },
  ferme: {
    label: 'Terminée',
    activeBg: 'var(--green-9)', // Vert OK/clôturé
    hoverBg: 'var(--green-7)',
    inactiveBg: 'var(--gray-3)',
    textActive: 'white',
    textInactive: 'var(--gray-10)',
  },
};

/**
 * COULEURS DE PRIORITÉ
 * Utilisé pour les boutons de priorité avec états actif/hover/inactif
 * Structure: { activeBg, hoverBg, inactiveBg, textActive, textInactive }
 */
export const PRIORITY_COLORS = {
  urgent: {
    label: 'Urgent',
    activeBg: 'var(--red-9)', // Rouge bloqué
    hoverBg: 'var(--red-7)',
    inactiveBg: 'var(--gray-3)',
    textActive: 'white',
    textInactive: 'var(--gray-10)',
  },
  important: {
    label: 'Important',
    activeBg: 'var(--amber-9)', // Orange attente
    hoverBg: 'var(--amber-7)',
    inactiveBg: 'var(--gray-3)',
    textActive: 'white',
    textInactive: 'var(--gray-10)',
  },
  normal: {
    label: 'Normal',
    activeBg: 'var(--blue-9)', // Bleu industriel
    hoverBg: 'var(--blue-7)',
    inactiveBg: 'var(--gray-3)',
    textActive: 'white',
    textInactive: 'var(--gray-10)',
  },
  faible: {
    label: 'Faible',
    activeBg: 'var(--gray-9)',
    hoverBg: 'var(--gray-7)',
    inactiveBg: 'var(--gray-2)',
    textActive: 'white',
    textInactive: 'var(--gray-9)',
  },
};

export const KANBAN_COLUMNS = [
  { id: 'ouvert', title: 'Ouvert' },
  { id: 'attente_prod', title: 'Attente production' },
  { id: 'attente_pieces', title: 'Attente pièces' },
];

// Note: Les couleurs des catégories d'actions proviennent maintenant du backend
// via le champ category.color dans action_subcategory
