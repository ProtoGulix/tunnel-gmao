/**
 * @fileoverview Périodes du tableau de bord d'un équipement et filtres de la modale d'interventions.
 * Ne fait que formater des dates de filtre : tous les agrégats viennent de l'API.
 * @module hooks/equipements/dashboardFilters
 */

export const PERIOD_OPTIONS = [
  { value: '6', label: '6 mois' },
  { value: '12', label: '12 mois' },
  { value: '24', label: '24 mois' },
  { value: 'since', label: 'Depuis la mise en service (10 ans au plus)' },
];

const pad = (n) => String(n).padStart(2, '0');

/**
 * Date de début à envoyer à l'API pour une période choisie.
 * 12 mois : undefined, le serveur applique son défaut.
 * @param {string} period - '6' | '12' | '24' | 'since'
 * @param {string|null} [commissioningDate] - date_mise_service (AAAA-MM-JJ)
 * @param {Date} [now]
 * @returns {string|undefined}
 */
export function periodStartDate(period, commissioningDate, now = new Date()) {
  if (period === 'since') return sinceCommissioning(commissioningDate, now);
  if (period === '12') return undefined;
  return monthsBackStart(Number(period), now);
}

// Premier jour du mois, `months` mois calendaires en arrière, mois courant inclus.
function monthsBackStart(months, now) {
  const first = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  return `${first.getFullYear()}-${pad(first.getMonth() + 1)}-01`;
}

// L'API refuse une période de plus de 10 ans : une mise en service plus ancienne
// est ramenée aux 120 derniers mois.
function sinceCommissioning(commissioningDate, now) {
  if (!commissioningDate) return undefined;
  const floor = monthsBackStart(120, now);
  return commissioningDate < floor ? floor : commissioningDate;
}

/**
 * Filtres de la modale pour un mois "AAAA-MM", bornés à la période du tableau de bord
 * (le premier mois peut être partiel).
 * @param {string} month - "AAAA-MM"
 * @param {{start: string, end: string}} period
 * @returns {{reportedFrom: string, reportedTo: string}}
 */
export function monthFilters(month, period) {
  const [year, mm] = month.split('-').map(Number);
  const monthStart = `${month}-01`;
  const monthEnd = `${month}-${pad(new Date(year, mm, 0).getDate())}`;
  return {
    reportedFrom: monthStart < period.start ? period.start : monthStart,
    reportedTo: monthEnd > period.end ? period.end : monthEnd,
  };
}

/** Filtres de la modale pour toute la période, avec un type optionnel */
export function periodFilters(period, typeInter) {
  const filters = { reportedFrom: period.start, reportedTo: period.end };
  if (typeInter) filters.typeInter = typeInter;
  return filters;
}
