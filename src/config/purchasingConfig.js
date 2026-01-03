// Status configuration for purchase requests
// Utilise les statuts réels de la base de données
export const PURCHASE_REQUEST_STATUS = {
  OPEN: {
    id: 'open',
    label: 'Ouverte',
    color: 'gray',
    description: 'Demande ouverte, prête à dispatcher',
    icon: 'Circle',
  },
  IN_PROGRESS: {
    id: 'in_progress',
    label: 'En cours',
    color: 'blue',
    description: 'En cours de traitement',
    icon: 'Clock',
  },
  ORDERED: {
    id: 'ordered',
    label: 'Commandée',
    color: 'amber',
    description: 'Affectée à un panier fournisseur',
    icon: 'ShoppingCart',
  },
  RECEIVED: {
    id: 'received',
    label: 'Reçue',
    color: 'green',
    description: 'Marchandise reçue',
    icon: 'PackageCheck',
  },
  CANCELLED: {
    id: 'cancelled',
    label: 'Annulée',
    color: 'red',
    description: 'Demande annulée',
    icon: 'XCircle',
  },
};

// Allowed status transitions
export const PURCHASE_REQUEST_TRANSITIONS = {
  open: ['in_progress', 'ordered', 'cancelled'],
  in_progress: ['ordered', 'cancelled'],
  ordered: ['received', 'cancelled'],
  received: [],
  cancelled: [],
};

// Supplier order status configuration
export const SUPPLIER_ORDER_STATUS = {
  OPEN: {
    id: 'OPEN',
    label: 'Ouvert',
    color: 'gray',
    description: 'En construction, peut recevoir de nouvelles lignes',
    icon: 'FolderOpen',
  },
  SENT: {
    id: 'SENT',
    label: 'Envoyé (en attente réponse)',
    color: 'blue',
    description: 'Envoyé au fournisseur, en attente de réponse',
    icon: 'Send',
  },
  ACK: {
    id: 'ACK',
    label: 'Réponse reçue (devis/confirmation)',
    color: 'amber',
    description: 'Le fournisseur a répondu avec un devis ou une confirmation',
    icon: 'Mail',
  },
  RECEIVED: {
    id: 'RECEIVED',
    label: 'Commandé',
    color: 'green',
    description: 'Commande validée chez le fournisseur',
    icon: 'PackageCheck',
  },
  CLOSED: {
    id: 'CLOSED',
    label: 'Clôturé',
    color: 'gray',
    description: 'Commande terminée et clôturée',
    icon: 'Archive',
  },
  CANCELLED: {
    id: 'CANCELLED',
    label: 'Annulé',
    color: 'red',
    description: 'Commande annulée',
    icon: 'XCircle',
  },
};

// Stock item types
export const STOCK_ITEM_TYPE = {
  STANDARD: {
    id: 'STANDARD',
    label: 'Standard',
    color: 'blue',
    description: 'Article catalogue standard',
  },
  SPECIFIQUE: {
    id: 'SPECIFIQUE',
    label: 'Spécifique',
    color: 'amber',
    description: 'Article sur mesure / DIV / LIB',
  },
};

// Get status config
export const getPurchaseRequestStatus = (statusId) => {
  return PURCHASE_REQUEST_STATUS[statusId] || PURCHASE_REQUEST_STATUS.DRAFT;
};

export const getSupplierOrderStatus = (statusId) => {
  if (!statusId) return SUPPLIER_ORDER_STATUS.OPEN;
  const key = String(statusId).toUpperCase();
  return SUPPLIER_ORDER_STATUS[key] || SUPPLIER_ORDER_STATUS.OPEN;
};

// Check if transition is allowed
export const canTransitionPurchaseRequest = (fromStatus, toStatus) => {
  const allowed = PURCHASE_REQUEST_TRANSITIONS[fromStatus] || [];
  return allowed.includes(toStatus);
};
