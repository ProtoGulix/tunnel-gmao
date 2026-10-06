/**
 * PALETTE DE COULEURS GMAO MVP
 *
 * Palette industrielle stricte (max 3 couleurs fixes + états)
 *
 * COULEURS FIXES:
 * - Bleu industriel (primaire): #1F3A5F
 * - Gris foncé (texte/icônes): #2E2E2E
 * - Gris clair (fond): #F4F6F8
 *
 * COULEURS ÉTAT (usage strict):
 * - Vert OK/clôturé: #2E7D32
 * - Orange attente: #ED6C02
 * - Rouge bloqué: #C62828
 *
 * INTERDICTIONS:
 * - Pas de dégradé
 * - Pas de couleur "fun"
 * - Pas de vert hors validation réelle
 */

export const COLOR_PALETTE = {
  // Couleurs fixes
  primary: '#1F3A5F', // Bleu industriel
  text: '#2E2E2E', // Gris foncé (texte/icônes)
  background: '#F4F6F8', // Gris clair (fond)

  // Couleurs état
  success: '#2E7D32', // Vert OK/clôturé
  warning: '#ED6C02', // Orange attente
  error: '#C62828', // Rouge bloqué

  // Nuances utilitaires (dérivées de la palette)
  textSecondary: '#616161', // Texte secondaire
  border: '#E0E0E0', // Bordures
  divider: '#BDBDBD', // Séparateurs
  surface: '#FFFFFF', // Surface cards/modals

  // Variations uniformes (10 niveaux par couleur, basées sur Radix UI)
  // Convention: Tone1 = très clair, Tone10 = très foncé
  primaryTone1: 'var(--blue-1)',
  primaryTone2: 'var(--blue-2)',
  primaryTone3: 'var(--blue-3)',
  primaryTone4: 'var(--blue-4)',
  primaryTone5: 'var(--blue-5)',
  primaryTone6: 'var(--blue-6)',
  primaryTone7: 'var(--blue-7)',
  primaryTone8: 'var(--blue-8)',
  primaryTone9: 'var(--blue-9)',
  primaryTone10: 'var(--blue-10)',

  grayTone1: 'var(--gray-1)',
  grayTone2: 'var(--gray-2)',
  grayTone3: 'var(--gray-3)',
  grayTone4: 'var(--gray-4)',
  grayTone5: 'var(--gray-5)',
  grayTone6: 'var(--gray-6)',
  grayTone7: 'var(--gray-7)',
  grayTone8: 'var(--gray-8)',
  grayTone9: 'var(--gray-9)',
  grayTone10: 'var(--gray-10)',

  successTone1: 'var(--green-1)',
  successTone2: 'var(--green-2)',
  successTone3: 'var(--green-3)',
  successTone4: 'var(--green-4)',
  successTone5: 'var(--green-5)',
  successTone6: 'var(--green-6)',
  successTone7: 'var(--green-7)',
  successTone8: 'var(--green-8)',
  successTone9: 'var(--green-9)',
  successTone10: 'var(--green-10)',

  warningTone1: 'var(--amber-1)',
  warningTone2: 'var(--amber-2)',
  warningTone3: 'var(--amber-3)',
  warningTone4: 'var(--amber-4)',
  warningTone5: 'var(--amber-5)',
  warningTone6: 'var(--amber-6)',
  warningTone7: 'var(--amber-7)',
  warningTone8: 'var(--amber-8)',
  warningTone9: 'var(--amber-9)',
  warningTone10: 'var(--amber-10)',

  errorTone1: 'var(--red-1)',
  errorTone2: 'var(--red-2)',
  errorTone3: 'var(--red-3)',
  errorTone4: 'var(--red-4)',
  errorTone5: 'var(--red-5)',
  errorTone6: 'var(--red-6)',
  errorTone7: 'var(--red-7)',
  errorTone8: 'var(--red-8)',
  errorTone9: 'var(--red-9)',
  errorTone10: 'var(--red-10)',
};

/**
 * Mapping vers les couleurs Radix UI
 * Pour maintenir la compatibilité avec les composants existants
 */
export const RADIX_COLOR_MAP = {
  // Couleur primaire → blue (bleu industriel)
  primary: 'blue',

  // États
  success: 'green',
  warning: 'amber',
  error: 'red',

  // Neutres
  gray: 'gray',
  neutral: 'gray',
};

/**
 * Usage des couleurs par contexte
 */
export const COLOR_USAGE = {
  // Statuts d'intervention
  intervention: {
    ouvert: COLOR_PALETTE.primary, // En cours → bleu industriel
    attente_pieces: COLOR_PALETTE.error, // Bloqué → rouge
    attente_prod: COLOR_PALETTE.warning, // Attente → orange
    ferme: COLOR_PALETTE.success, // Clôturé → vert
  },

  // Priorités
  priority: {
    urgent: COLOR_PALETTE.error, // Rouge
    important: COLOR_PALETTE.warning, // Orange
    normal: COLOR_PALETTE.primary, // Bleu
    faible: COLOR_PALETTE.textSecondary, // Gris
  },

  // Niveaux d'urgence (achats/demandes)
  urgency: {
    high: COLOR_PALETTE.error, // Rouge
    normal: COLOR_PALETTE.warning, // Orange
    low: COLOR_PALETTE.textSecondary, // Gris
  },

  // Achats
  purchasing: {
    open: COLOR_PALETTE.textSecondary, // Gris
    in_progress: COLOR_PALETTE.primary, // Bleu
    ordered: COLOR_PALETTE.warning, // Orange
    received: COLOR_PALETTE.success, // Vert
    cancelled: COLOR_PALETTE.error, // Rouge
  },

  // Machines
  machine: {
    ok: COLOR_PALETTE.success, // Vert
    maintenance: COLOR_PALETTE.primary, // Bleu
    warning: COLOR_PALETTE.warning, // Orange
    critical: COLOR_PALETTE.error, // Rouge
  },
};

export default COLOR_PALETTE;

/**
 * Nuances (10 niveaux) alignées sur Radix UI
 * Utiliser ces variables pour des arrière-plans/bordures
 * afin de garder l'UI uniforme (pas de dégradés personnalisés).
 *
 * Convention: 1 = très clair, 10 = très foncé
 */
export const COLOR_SCALES = {
  // Bleu industriel (primary)
  primary: [
    'var(--blue-1)',
    'var(--blue-2)',
    'var(--blue-3)',
    'var(--blue-4)',
    'var(--blue-5)',
    'var(--blue-6)',
    'var(--blue-7)',
    'var(--blue-8)',
    'var(--blue-9)',
    'var(--blue-10)',
  ],

  // Neutres / gris
  gray: [
    'var(--gray-1)',
    'var(--gray-2)',
    'var(--gray-3)',
    'var(--gray-4)',
    'var(--gray-5)',
    'var(--gray-6)',
    'var(--gray-7)',
    'var(--gray-8)',
    'var(--gray-9)',
    'var(--gray-10)',
  ],

  // États
  success: [
    'var(--green-1)',
    'var(--green-2)',
    'var(--green-3)',
    'var(--green-4)',
    'var(--green-5)',
    'var(--green-6)',
    'var(--green-7)',
    'var(--green-8)',
    'var(--green-9)',
    'var(--green-10)',
  ],
  warning: [
    'var(--amber-1)',
    'var(--amber-2)',
    'var(--amber-3)',
    'var(--amber-4)',
    'var(--amber-5)',
    'var(--amber-6)',
    'var(--amber-7)',
    'var(--amber-8)',
    'var(--amber-9)',
    'var(--amber-10)',
  ],
  error: [
    'var(--red-1)',
    'var(--red-2)',
    'var(--red-3)',
    'var(--red-4)',
    'var(--red-5)',
    'var(--red-6)',
    'var(--red-7)',
    'var(--red-8)',
    'var(--red-9)',
    'var(--red-10)',
  ],
};

/**
 * Accès par niveau (1..10) pour usage programmatique
 * Exemple: COLOR_TONES.primary[7] → 'var(--blue-7)'
 */
export const COLOR_TONES = {
  primary: Object.fromEntries(COLOR_SCALES.primary.map((v, i) => [i + 1, v])),
  gray: Object.fromEntries(COLOR_SCALES.gray.map((v, i) => [i + 1, v])),
  success: Object.fromEntries(COLOR_SCALES.success.map((v, i) => [i + 1, v])),
  warning: Object.fromEntries(COLOR_SCALES.warning.map((v, i) => [i + 1, v])),
  error: Object.fromEntries(COLOR_SCALES.error.map((v, i) => [i + 1, v])),
};
