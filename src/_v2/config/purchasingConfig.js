// Status configuration for purchase requests
// Utilise les codes derived_status du backend (v1.2.1)
export const PURCHASE_REQUEST_STATUS = {
  TO_QUALIFY: {
    id: 'TO_QUALIFY',
    label: 'À qualifier',
    color: 'amber',
    description: 'Pas de référence stock normalisée',
    icon: 'AlertTriangle',
  },
  OPEN: {
    id: 'OPEN',
    label: 'En attente',
    color: 'blue',
    description: 'En attente de dispatch (aucune ligne de commande)',
    icon: 'Circle',
  },
  QUOTED: {
    id: 'QUOTED',
    label: 'Devis reçu',
    color: 'blue',
    description: 'Au moins un devis reçu',
    icon: 'FileText',
  },
  ORDERED: {
    id: 'ORDERED',
    label: 'Commandée',
    color: 'green',
    description: 'Au moins une ligne sélectionnée pour commande',
    icon: 'ShoppingCart',
  },
  PARTIAL: {
    id: 'PARTIAL',
    label: 'Partielle',
    color: 'green',
    description: 'Livraison partielle',
    icon: 'PackageMinus',
  },
  RECEIVED: {
    id: 'RECEIVED',
    label: 'Reçue',
    color: 'green',
    description: 'Livraison complète',
    icon: 'PackageCheck',
  },
  REJECTED: {
    id: 'REJECTED',
    label: 'Refusée',
    color: 'red',
    description: 'Demande annulée',
    icon: 'XCircle',
  },
};

// Allowed status transitions (derived_status is calculated automatically, no manual transitions)
export const PURCHASE_REQUEST_TRANSITIONS = {
  TO_QUALIFY: ['OPEN', 'REJECTED'],
  OPEN: ['QUOTED', 'ORDERED', 'REJECTED'],
  QUOTED: ['ORDERED', 'REJECTED'],
  ORDERED: ['PARTIAL', 'RECEIVED', 'REJECTED'],
  PARTIAL: ['RECEIVED', 'REJECTED'],
  RECEIVED: [],
  REJECTED: [],
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
