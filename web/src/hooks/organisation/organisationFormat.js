/**
 * @fileoverview Formats d'affichage de la page Organisation (parts, âges, alerte de génération).
 * Ne calcule aucun agrégat métier : les valeurs viennent de l'API.
 * @module hooks/organisation/organisationFormat
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Au-delà de ce nombre de jours sans génération du préventif, la tuile passe en alerte */
export const GENERATION_ALERT_DAYS = 35;

const decimal = (v, digits = 1) => v.toLocaleString('fr-FR', { maximumFractionDigits: digits });

/** Part en % (l'API l'arrondit à 1 décimale) ; null devient « — », jamais 0 % */
export function formatPct(value) {
  return value == null ? '—' : `${decimal(value)} %`;
}

/** Nombre décimal ; null devient « — » */
export function formatNumber(value, digits = 1) {
  return value == null ? '—' : decimal(value, digits);
}

/** Heures avec leur unité */
export function formatHours(value) {
  return `${decimal(value ?? 0)} h`;
}

/** Âge en jours : « 1 jour », « 12 jours » ; null devient « — » */
export function formatDays(days) {
  if (days == null) return '—';
  const n = Math.round(days * 10) / 10;
  return `${decimal(n)} ${n >= 2 ? 'jours' : 'jour'}`;
}

/** Part d'une valeur dans un total, 1 décimale ; null si le total est nul */
export function shareOf(part, total) {
  if (!total || total <= 0) return null;
  return Math.round(((part ?? 0) / total) * 1000) / 10;
}

/**
 * État de la dernière génération du préventif.
 * @param {string|null} lastGeneratedAt - horodatage ISO
 * @param {Date} [now]
 * @returns {{days: number|null, alert: boolean}} alert : jamais généré ou au-delà de 35 jours
 */
export function generationStatus(lastGeneratedAt, now = new Date()) {
  if (!lastGeneratedAt) return { days: null, alert: true };
  const time = new Date(lastGeneratedAt).getTime();
  if (Number.isNaN(time)) return { days: null, alert: true };
  const days = Math.max(0, Math.floor((now.getTime() - time) / DAY_MS));
  return { days, alert: days > GENERATION_ALERT_DAYS };
}
