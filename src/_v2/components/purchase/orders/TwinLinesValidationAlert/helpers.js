/**
 * @fileoverview Helpers pour TwinLinesValidationAlert
 * @module components/purchase/orders/TwinLinesValidationAlert/helpers
 */

/**
 * Extrait les informations de l'ordre fournisseur
 * @param {Object} order - Ordre fournisseur
 * @returns {{status: string, supplier: string, orderNumber: string, orderId: string}}
 */
export const extractOrderInfo = (order) => {
  if (!order) {
    return { status: 'UNKNOWN', supplier: '?', orderNumber: '—', orderId: null };
  }

  const status = typeof order === 'object' ? order.status || 'UNKNOWN' : '?';
  const supplierObj = typeof order === 'object' ? order.supplier : null;
  const supplier = supplierObj && typeof supplierObj === 'object' ? supplierObj.name || '?' : '?';
  const orderNumber = typeof order === 'object' ? order.orderNumber || '—' : '—';
  const orderId = typeof order === 'object' ? order.id : order;

  return { status, supplier, orderNumber, orderId };
};

/**
 * Extrait les informations de l'article
 * @param {Object} line - Ligne de commande
 * @returns {{name: string, ref: string|null}}
 */
export const extractStockItemInfo = (line) => {
  const stockItem = line?.stock_item_id || line?.stockItem;
  const name = typeof stockItem === 'object' ? stockItem.name : 'Article inconnu';
  const ref = typeof stockItem === 'object' ? stockItem.ref : null;

  return { name, ref };
};

/**
 * Détermine la couleur du badge de statut
 * @param {string} status - Statut de la commande
 * @returns {string} Couleur Radix UI
 */
export const getStatusBadgeColor = (status) => {
  return status === 'SENT' ? 'blue' : 'red';
};

/**
 * Détermine la couleur du badge de sélection
 * @param {boolean} isSelected - Si la ligne est sélectionnée
 * @returns {string} Couleur Radix UI
 */
export const getSelectionBadgeColor = (isSelected) => {
  return isSelected ? 'green' : 'gray';
};

/**
 * Détermine la couleur du badge de devis
 * @param {boolean} quoteReceived - Si le devis est reçu
 * @returns {string} Couleur Radix UI
 */
export const getQuoteBadgeColor = (quoteReceived) => {
  return quoteReceived ? 'green' : 'orange';
};
