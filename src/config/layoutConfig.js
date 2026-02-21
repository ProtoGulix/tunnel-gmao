/**
 * Configuration globale du layout de l'application
 */

// Largeur maximale des containers de contenu
export const CONTAINER_MAX_WIDTH = '1600px';

// Props par défaut pour les containers de page
export const DEFAULT_CONTAINER_PROPS = {
  p: '3',
  style: { maxWidth: CONTAINER_MAX_WIDTH },
};

// ============================================
// Configuration Layout principal
// ============================================

// Largeur de la sidebar en pixels
export const SIDEBAR_WIDTH = 220;

// Hauteur du header mobile en pixels
export const MOBILE_HEADER_HEIGHT = 56;

// Breakpoint responsive mobile/desktop
export const MOBILE_BREAKPOINT = 768;

// Media query string pour mobile
export const MOBILE_QUERY = `(max-width: ${MOBILE_BREAKPOINT}px)`;
