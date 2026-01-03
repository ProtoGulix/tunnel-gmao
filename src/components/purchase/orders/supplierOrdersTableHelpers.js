/**
 * @fileoverview Helpers pour SupplierOrdersTable component
 * @module components/purchase/orders/supplierOrdersTableHelpers
 */

import { getAgeInDays, getCreatedAt } from './supplierOrdersConfig';

/**
 * Trie les commandes : non-commandées d'abord, puis par âge décroissant
 * @param {Array} orders - Commandes à trier
 * @returns {Array} Commandes triées
 */
export const sortOrdersByStatusAndAge = (orders) => {
  return [...orders].sort((a, b) => {
    const aCompleted = ['RECEIVED', 'CLOSED', 'CANCELLED'].includes(a.status);
    const bCompleted = ['RECEIVED', 'CLOSED', 'CANCELLED'].includes(b.status);
    if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;

    const ageA = getAgeInDays(getCreatedAt(a)) || 0;
    const ageB = getAgeInDays(getCreatedAt(b)) || 0;
    return ageB - ageA;
  });
};

/**
 * Options de filtre statut
 */
export const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Tous' },
  { value: 'OPEN', label: 'Ouverts' },
  { value: 'SENT', label: 'Envoyés (attente réponse)' },
  { value: 'ACK', label: 'Réponse reçue' },
  { value: 'RECEIVED', label: 'Commandés' },
  { value: 'CLOSED', label: 'Clôturés' },
];
