/**
 * @fileoverview Utilitaires de formatage pour les composants charge technique
 * @module components/charge/constants
 */

/**
 * Formate une durée en heures
 * @param {number} hours - Durée en heures
 * @returns {string} Durée formatée
 */
export const formatHours = (hours) => {
  if (hours === null || hours === undefined) return '—';
  return `${hours.toFixed(1)}h`;
};

/**
 * Formate un pourcentage
 * @param {number} value - Valeur en pourcentage
 * @returns {string} Pourcentage formaté
 */
export const formatPercent = (value) => {
  if (value === null || value === undefined) return '—';
  return `${value.toFixed(1)}%`;
};
