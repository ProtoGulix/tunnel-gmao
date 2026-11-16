/**
 * @fileoverview Couleurs du tableau de bord d'un équipement.
 * Un type d'intervention a une teinte fixe par code (l'API en donne plusieurs identiques) ;
 * une catégorie garde la couleur de l'API, sinon une teinte de repli à rang fixe.
 * @module components/equipements/dashboardColors
 */

// Teintes Radix, étape 9 (suivent le thème clair et sombre). Rouge pour Curatif et vert
// pour Préventif sont conservés ; les autres sont distinctes.
const TYPE_HUES = {
  CUR: 'red',
  PRE: 'green',
  REA: 'blue',
  PRO: 'violet',
  PIL: 'cyan',
  MES: 'pink',
  COF: 'plum',
  BAT: 'teal',
};

// Ordre validé avec validate_palette.js (clair #ffffff, sombre #18191b) : bande de luminosité,
// chroma, contraste et distinction en vision normale OK ; séparation daltonisme entre voisins
// à 7,8 (zone tolérée), d'où la légende chiffrée et les 2 px entre parts.
// Hex de contrôle : #6e56cf #00a2c7 #e5484d #12a594 #0090ff #ab4aba #30a46c #d6409f
const FALLBACK = ['violet', 'cyan', 'red', 'teal', 'blue', 'plum', 'green', 'pink'];

const cssVar = (hue) => `var(--${hue}-9)`;

/** Couleur d'un type d'intervention, stable quel que soit l'ordre ou le filtre */
export function typeColor(code) {
  return cssVar(TYPE_HUES[code] ?? 'gray');
}

/**
 * @param {string|null|undefined} apiColor - nom Radix ou hexadécimal fourni par l'API
 * @param {number} index - rang de la part, pour la teinte de repli
 * @returns {string} valeur CSS
 */
export function sliceColor(apiColor, index) {
  if (apiColor && /^#[0-9a-fA-F]{3,8}$/.test(apiColor)) return apiColor;
  if (apiColor && /^[a-z]+$/.test(apiColor)) return cssVar(apiColor);
  return cssVar(FALLBACK[index % FALLBACK.length]);
}

/**
 * Teinte de repli liée au code (somme des caractères), pas au rang : la couleur d'un
 * facteur ou d'une catégorie ne change pas quand l'ordre ou le filtre change.
 * Deux codes peuvent partager une teinte ; la légende reste le repère.
 */
export function codeColor(apiColor, code) {
  const sum = [...String(code ?? '')].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return sliceColor(apiColor, sum);
}
