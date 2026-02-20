/**
 * Utilitaires de conversion de couleurs
 * Basé sur la palette industrielle stricte
 *
 * Couleurs hex → Radix UI colors
 */
import { COLOR_PALETTE } from "@/config/colorPalette";

// Mapping des couleurs hex vers les couleurs Radix UI
const HEX_TO_RADIX_COLOR = {
  // Primaire (bleu industriel)
  "#1F3A5F": "blue",

  // États
  "#2E7D32": "green", // Vert OK/clôturé
  "#ED6C02": "amber", // Orange attente
  "#C62828": "red", // Rouge bloqué

  // Neutres
  "#9CA3AF": "gray", // Gris (legacy)
  "#2E2E2E": "gray", // Gris foncé
  "#F4F6F8": "gray", // Gris clair
};

export function hexToRadixColor(hexColor) {
  if (!hexColor) return "gray";
  return HEX_TO_RADIX_COLOR[hexColor.toUpperCase()] || "gray";
}

/**
 * Obtient la couleur hex depuis la palette
 */
export function getColor(key) {
  return COLOR_PALETTE[key] || COLOR_PALETTE.text;
}
