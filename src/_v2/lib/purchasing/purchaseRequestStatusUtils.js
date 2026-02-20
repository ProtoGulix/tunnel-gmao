/**
 * @fileoverview Logique de dérivation du statut des demandes d'achat
 * @module lib/purchasing/purchaseRequestStatusUtils
 * 
 * Au lieu de stocker le statut en double dans purchase_request,
 * on le dérive directement depuis les relations de table:
 * - purchase_request → supplier_order_line_purchase_request → supplier_order_line → supplier_order
 */

/**
 * Calcule le statut d'une demande d'achat basé sur les commandes associées
 *
 * Règles de dérivation (SUPPLIER_ORDER_LIFECYCLE.md):
 * - 'open'       : pas encore liée à une ligne de commande (à dispatcher)
 * - 'pooling'    : liée à OPEN (mutualisation)
 * - 'sent'       : liée à SENT (en chiffrage)
 * - 'ordered'    : liée à ACK ou RECEIVED (commandé)
 * - 'received'   : liée à CLOSED (clôturé/réceptionné)
 * - 'cancelled'  : liée à CANCELLED (retour à dispatcher) ou flag is_cancelled
 *
 * @param {Object} purchaseRequest - La demande d'achat avec ses relations
 * @param {Array} purchaseRequest.supplier_order_line_ids - Relations M2M vers les lignes commandes
 * @returns {string} Le statut calculé
 */
export const derivePurchaseRequestStatus = (purchaseRequest) => {
  // Si explicitement annulée, retourner cancelled
  if (purchaseRequest.status === 'cancelled' || purchaseRequest.is_cancelled) {
    return 'cancelled';
  }

  // Récupérer les relations M2M
  const orderLineRelations = purchaseRequest.supplier_order_line_ids || [];

  if (!Array.isArray(orderLineRelations) || orderLineRelations.length === 0) {
    // Pas de lien avec une commande → open
    return 'open';
  }

  // Analyser les statuts des commandes associées
  // RÈGLE: Si plusieurs paniers, seule la ligne is_selected=true compte
  const supplierOrderStatuses = new Set();
  let hasAnyFullyReceivedLine = false;

  // 1. Chercher d'abord les lignes sélectionnées
  const selectedLines = orderLineRelations.filter(relation => {
    const lineData = relation.supplier_order_line_id;
    return lineData && (lineData.is_selected === true || lineData.isSelected === true);
  });

  // 2. Si aucune ligne explicitement sélectionnée, prendre toutes (fallback ancien concept)
  const linesToConsider = selectedLines.length > 0 ? selectedLines : orderLineRelations;

  for (const relation of linesToConsider) {
    const lineData = relation.supplier_order_line_id;
    if (!lineData) {
      continue;
    }

    // Vérifier si la ligne est fully reçue (info best-effort)
    const quantityOrdered = lineData.quantity || 0;
    const quantityReceived = lineData.quantity_received || 0;
    if (quantityReceived >= quantityOrdered && quantityOrdered > 0) {
      hasAnyFullyReceivedLine = true;
    }

    // Récupérer le statut du panier (supplier_order)
    const supplierOrder = lineData.supplier_order_id;
    if (supplierOrder && supplierOrder.status) {
      const statusUpper = String(supplierOrder.status).toUpperCase();
      supplierOrderStatuses.add(statusUpper);
    }
  }

  // CLOSED → received (selon SUPPLIER_ORDER_LIFECYCLE.md)
  if (supplierOrderStatuses.has('CLOSED')) {
    return 'received';
  }
  
  // CANCELLED → open (retour à dispatcher)
  if (supplierOrderStatuses.has('CANCELLED')) {
    return 'open';
  }

  // ACK ou RECEIVED → ordered (commandé)
  if (supplierOrderStatuses.has('ACK') || supplierOrderStatuses.has('RECEIVED')) {
    return 'ordered';
  }

  // SENT → sent (en chiffrage)
  if (supplierOrderStatuses.has('SENT')) {
    return 'sent';
  }

  // OPEN → pooling (mutualisation)
  if (supplierOrderStatuses.has('OPEN') || supplierOrderStatuses.has('POOLING')) {
    return 'pooling';
  }

  // Cas par défaut (statut inconnu ou ancien concept)
  return 'open';
};

/**
 * Enrichit une demande d'achat avec son statut dérivé
 * Utile pour éviter la redondance lors de la sérialisation
 *
 * @param {Object} purchaseRequest - La demande d'achat
 * @returns {Object} La demande avec le statut calculé
 */
export const enrichPurchaseRequestWithDerivedStatus = (purchaseRequest) => {
  return {
    ...purchaseRequest,
    derived_status: derivePurchaseRequestStatus(purchaseRequest),
    // Garder l'original pour compatibilité rétroactive
    status: purchaseRequest.status,
  };
};

/**
 * Calcule les statistiques de statuts pour une liste de demandes d'achat
 *
 * @param {Array} purchaseRequests - Liste des demandes d'achat avec relations
 * @returns {Object} Comptage par statut
 */
export const calculatePurchaseRequestStatusStats = (purchaseRequests = []) => {
  const stats = {
    open: 0,
    pooling: 0,
    sent: 0,
    ordered: 0,
    received: 0,
    cancelled: 0,
  };

  for (const pr of purchaseRequests) {
    const status = derivePurchaseRequestStatus(pr);
    if (stats.hasOwnProperty(status)) {
      stats[status]++;
    }
  }

  return stats;
};

/**
 * Filtre les demandes d'achat par statut dérivé
 *
 * @param {Array} purchaseRequests - Liste des demandes
 * @param {string|Array<string>} targetStatus - Statut(s) cible(s)
 * @returns {Array} Demandes filtrées
 */
export const filterByDerivedStatus = (purchaseRequests = [], targetStatus) => {
  const targets = Array.isArray(targetStatus) ? targetStatus : [targetStatus];
  
  return purchaseRequests.filter((pr) => {
    const status = derivePurchaseRequestStatus(pr);
    return targets.includes(status);
  });
};
