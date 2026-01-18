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
  { value: 'CANCELLED', label: 'Annulés' },
];

const STATUS_RANK = { OPEN: 1, SENT: 2, ACK: 3, RECEIVED: 4, CLOSED: 5, CANCELLED: 6 };

const sortByAge = (orders, sortDir) => {
  const sorted = [...orders];
  sorted.sort((a, b) => {
    const ageA = getAgeInDays(getCreatedAt(a)) || 0;
    const ageB = getAgeInDays(getCreatedAt(b)) || 0;
    return sortDir === 'asc' ? ageA - ageB : ageB - ageA;
  });
  return sorted;
};

const getStatusRank = (order) => {
  const status = order?.status?.toUpperCase?.() || 'OPEN';
  return STATUS_RANK[status] || 99;
};

const sortByStatus = (orders, sortDir) => {
  const sorted = [...orders];
  sorted.sort((a, b) => {
    const av = getStatusRank(a);
    const bv = getStatusRank(b);
    return sortDir === 'asc' ? av - bv : bv - av;
  });
  return sorted;
};

export const sortOrders = (orders, sortKey, sortDir) => {
  if (!Array.isArray(orders)) return [];
  if (!sortKey) return sortOrdersByStatusAndAge(orders);
  if (sortKey === 'age') return sortByAge(orders, sortDir);
  if (sortKey === 'status') return sortByStatus(orders, sortDir);
  return [...orders];
};
