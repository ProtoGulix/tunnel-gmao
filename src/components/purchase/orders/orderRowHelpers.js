/**
 * @fileoverview Helpers pour OrderRow component
 * @module components/purchase/orders/orderRowHelpers
 */

import { getAgeInDays, canShowAmount } from './supplierOrdersConfig';

/**
 * Détermine si une ligne a des DAs urgentes (>5j)
 * @param {Object} line - Ligne de commande
 * @returns {boolean}
 */
export const hasUrgentPR = (line) => {
  const prs = line.purchaseRequests ?? line.purchase_requests ?? [];
  return prs.some((pr) => {
    const prObj = pr.purchaseRequest ?? pr.purchase_request_id;
    const reqDate = typeof prObj === 'object' ? prObj?.createdAt ?? prObj?.created_at : null;
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

/**
 * Récupère l'action primaire contexuelle
 * @param {string} status - Statut commande
 * @param {Function} onViewDetails
 * @param {Function} onSendEmail
 * @returns {Object} Action avec label, color, onClick
 */
export const getPrimaryActionConfig = (status, onViewDetails, onSendEmail) => {
  if (status === 'SENT') return { label: 'Relancer', color: 'amber', onClick: onSendEmail };
  if (status === 'ACK') return { label: 'Voir devis', color: 'blue', onClick: onViewDetails };
  if (status === 'RECEIVED') return { label: 'Suivi', color: 'blue', onClick: onViewDetails };
  return { label: 'Détails', color: 'gray', onClick: onViewDetails };
};

/**
 * Détermine si le montant doit être affiché pour le statut
 * @param {string} status - Statut commande
 * @returns {boolean}
 */
export const shouldShowAmount = (status) => canShowAmount(status);
