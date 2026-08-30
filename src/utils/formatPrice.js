/**
 * Formatage cohérent des montants du module achats.
 * @module utils/formatPrice
 */

export const NOT_PRICED_LABEL = 'Non chiffré';

/**
 * Formate un montant en euros, ou renvoie le libellé standard "Non chiffré"
 * quand aucun prix n'a encore été saisi (null/undefined) — distinct d'un
 * prix réellement à 0.
 * @param {number|null|undefined} value
 * @returns {string}
 */
export function formatPrice(value) {
  if (value == null) return NOT_PRICED_LABEL;
  return `${Number(value).toFixed(2)} €`;
}
