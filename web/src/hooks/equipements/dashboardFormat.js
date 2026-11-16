/**
 * @fileoverview Formats d'affichage du tableau de bord d'un équipement (mois et parts en %).
 * Ne calcule aucun agrégat métier : les valeurs viennent de l'API.
 * @module hooks/equipements/dashboardFormat
 */

const SHORT_MONTH = new Intl.DateTimeFormat('fr-FR', { month: 'short', year: '2-digit' });
const LONG_MONTH = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

// Date locale au premier du mois : évite tout décalage de fuseau d'un "AAAA-MM" lu en UTC
const monthDate = (month) => {
  const [year, mm] = month.split('-').map(Number);
  return new Date(year, mm - 1, 1);
};

/** "2026-04" -> "avr. 26" (graduations des graphiques) */
export function formatMonthShort(month) {
  return month ? SHORT_MONTH.format(monthDate(month)) : '';
}

/** "2026-04" -> "avril 2026" (infobulles, tableau, titre de la modale) */
export function formatMonthLong(month) {
  return month ? LONG_MONTH.format(monthDate(month)) : '';
}

/**
 * Part d'une valeur dans un total, en pourcentage entier ; "< 1 %" sous 1 %, "—" sans total.
 * @param {number} value
 * @param {number} total
 * @returns {string}
 */
export function formatShare(value, total) {
  if (!total || total <= 0 || !(value > 0)) return total > 0 ? '0 %' : '—';
  const pct = (value / total) * 100;
  return pct < 1 ? '< 1 %' : `${Math.round(pct)} %`;
}
