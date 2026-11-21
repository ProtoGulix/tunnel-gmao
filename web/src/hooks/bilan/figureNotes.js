/**
 * @fileoverview Textes d'accompagnement des chiffres clés de l'onglet État : ligne de seuils
 * (donnés par l'API, jamais recopiés dans le web) et mot de tendance (ADR 0034, points 8 et 10).
 * @module hooks/bilan/figureNotes
 */

import { formatPct } from '../organisation/organisationFormat.js';

// Nom des deux niveaux (orange, rouge), au même vocabulaire que les badges de l'API
const LEVEL_NAMES = {
  charge: ['élevée', 'au plafond'],
  fragmentation: ['notable', 'élevée'],
  pilotage: ['limité', 'absent'],
};

const TRENDS = {
  up: 'en hausse',
  stable: 'stable',
  down: 'en baisse',
};

/**
 * Ligne de seuils d'un indicateur, par exemple « Seuils : élevée dès 75 %, au plafond dès 100 % ».
 * @param {string} kind - 'charge', 'fragmentation' ou 'pilotage'
 * @param {{direction: string, orange: number, red: number}|undefined} threshold - bloc de l'API
 * @returns {string|null} null : seuils absents (ancienne API) ou indicateur inconnu
 */
export function thresholdsLine(kind, threshold) {
  const names = LEVEL_NAMES[kind];
  if (!names || !threshold || threshold.orange == null || threshold.red == null) return null;
  const bound = threshold.direction === 'below' ? 'jusqu\'à' : 'dès';
  return `Seuils : ${names[0]} ${bound} ${formatPct(threshold.orange)}, ${names[1]} ${bound} ${formatPct(threshold.red)}`;
}

/**
 * @param {string|null|undefined} trend - 'up', 'stable', 'down' ou null (donné par l'API)
 * @returns {{key: string, word: string}|null} null : pas de tendance à afficher
 */
export function trendView(trend) {
  return TRENDS[trend] ? { key: trend, word: TRENDS[trend] } : null;
}
