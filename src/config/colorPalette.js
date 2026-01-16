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
