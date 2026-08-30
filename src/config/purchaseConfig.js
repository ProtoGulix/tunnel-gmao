/**
 * Configuration UI du module Achats
 *
 * Centralise les labels, couleurs et listes des statuts et niveaux d'urgence
 * utilisés pour l'affichage (badges, onglets, filtres).
 *
 * Note : les statuts commande fournisseur viennent de GET /supplier-orders/statuses
 * via useSupplierOrderStatuses() — ne pas les hardcoder ici.
 */

function hexToRgb(hexColor) {
  const hex = hexColor.replace('#', '');
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
}

// Luminance relative WCAG à partir d'un triplet RGB (0-255)
function relativeLuminance([r, g, b]) {
  const toLinear = (c) => {
    const n = c / 255;
    return n <= 0.03928 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

// Ratio de contraste WCAG entre deux luminances relatives
function contrastRatio(l1, l2) {
  const [lighter, darker] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (lighter + 0.05) / (darker + 0.05);
}

// Mélange une couleur hex à une opacité donnée sur un fond blanc (approximation du
// fond réel du badge, --color-background étant clair dans le thème par défaut).
function blendOnWhite(hexColor, alpha) {
  const [r, g, b] = hexToRgb(hexColor);
  const mix = (c) => Math.round(c * alpha + 255 * (1 - alpha));
  return [mix(r), mix(g), mix(b)];
}

// Génère le style inline pour un Badge avec couleur hexadécimale retournée par le backend.
// Le fond reste teinté (13% d'opacité) ; le texte bascule en noir/blanc plein selon le
// contraste réellement obtenu contre CE fond dilué (pas contre la couleur pleine), pour
// garantir un contraste >= 4.5:1 (WCAG AA) quelle que soit la couleur hex arbitraire saisie
// côté admin/référentiel.
export function hexBadgeStyle(hexColor) {
  if (!hexColor?.startsWith('#')) return null;
  const bgLuminance = relativeLuminance(blendOnWhite(hexColor, 0x22 / 255));
  const textColor = contrastRatio(bgLuminance, 0) >= contrastRatio(bgLuminance, 1) ? '#000000' : '#ffffff';
  return { background: hexColor + '22', color: textColor, border: `1px solid ${hexColor}44` };
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

// Couleurs Radix des statuts d'intervention — affichées dans les fiches DA
export const INTERVENTION_STATUS_COLORS = {
  ouvert: 'blue',
  en_cours: 'blue',
  attente_pieces: 'red',
  attente_prod: 'amber',
  termine: 'green',
  cloture: 'gray',
  annule: 'gray',
};
