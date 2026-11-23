/**
 * @fileoverview Paramètres de la page Bilan du service (ADR 0033) : onglet et période.
 * Fonctions pures : l'URL est lue et écrite par useBilanParams.
 * @module hooks/bilan/bilanParams
 */

/** Périodes proposées, en mois calendaires (mois courant inclus) */
export const BILAN_PERIODS = [3, 6, 12, 24];
export const DEFAULT_MONTHS = 3;

/** Période demandée dans l'URL ; toute valeur hors liste retombe sur 3 mois */
export function parseMonths(raw) {
  const months = Number(raw);
  return BILAN_PERIODS.includes(months) ? months : DEFAULT_MONTHS;
}

/** Onglets de la page : état du service, constats, synthèse de l'audit, qualité des données */
export const BILAN_TABS = ['service', 'constats', 'audit', 'qualite'];

/** Onglet affiché : « audit » seulement avec le droit ; inconnu ou sans droit : « service » */
export function resolveTab(raw, canAudit) {
  if (raw === 'audit') return canAudit ? 'audit' : 'service';
  return BILAN_TABS.includes(raw) ? raw : 'service';
}

const pad = (n) => String(n).padStart(2, '0');

/** Date locale AAAA-MM-JJ (pas d'ISO UTC : elle décalerait le jour près de minuit) */
export function toDateString(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Premier jour du mois de début de la période, mois courant inclus */
export function periodStart(months, now = new Date()) {
  return toDateString(new Date(now.getFullYear(), now.getMonth() - (months - 1), 1));
}
