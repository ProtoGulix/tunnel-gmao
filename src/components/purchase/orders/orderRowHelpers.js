/**
 * @fileoverview Helpers pour OrderRow component
 * @module components/purchase/orders/orderRowHelpers
 */

import { getAgeInDays } from './supplierOrdersConfig';

/**
 * Détermine si une ligne a des DAs urgentes (>5j)
 * @param {Object} line - Ligne de commande
 * @returns {boolean}
 */
export const hasUrgentPR = (line) => {
  const prs = line.purchaseRequests ?? line.purchase_requests ?? [];
  return prs.some((pr) => {
    const prObj = pr.purchaseRequest ?? pr.purchase_request_id;
    const reqDate = typeof prObj === 'object' ? (prObj?.createdAt ?? prObj?.created_at) : null;
    if (!reqDate) return false;
    const age = getAgeInDays(reqDate);
    return age != null && age > 5;
  });
};

/**
 * Vérifie si commande a des lignes urgentes
 * @param {Map} cachedLines - Cache des lignes
 * @param {string|number} orderId - ID commande
 * @returns {boolean}
 */
export const isUrgentOrder = (cachedLines, orderId) => {
  if (!cachedLines.has(orderId)) return false;
  return (cachedLines.get(orderId) || []).some(hasUrgentPR);
};
