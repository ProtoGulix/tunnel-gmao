/**
 * Règles métier pour la gestion des items de panier fournisseur
 * selon leur statut (mutualisation → envoyé → commandé → clôturé)
 */

/**
 * Statuts de panier
 */
export const BASKET_STATUS = {
  POOLING: ['OPEN', 'POOLING'],
  SENT: ['SENT'],
  ORDERED: ['ACK', 'RECEIVED'],
  CLOSED: ['CLOSED', 'CANCELLED'],
};

/**
 * Normalise le statut d'un panier
 */
export function normalizeBasketStatus(status) {
  const upperStatus = (status || '').toUpperCase();
  
  if (BASKET_STATUS.POOLING.includes(upperStatus)) return 'POOLING';
  if (BASKET_STATUS.SENT.includes(upperStatus)) return 'SENT';
  if (BASKET_STATUS.ORDERED.includes(upperStatus)) return 'ORDERED';
  if (BASKET_STATUS.CLOSED.includes(upperStatus)) return 'CLOSED';
  
  return 'UNKNOWN';
}

/**
 * Vérifie si un item peut être sélectionné
 * @param {Object} basket - Le panier contenant l'item
 * @param {Object} item - L'item à vérifier
 * @returns {Object} { canSelect: boolean, reason: string }
 */
export function canSelectItem(basket, item) {
  const status = normalizeBasketStatus(basket.status);
  
  // Mutualisation : tous les items sont automatiquement sélectionnés
  if (status === 'POOLING') {
    return { canSelect: false, reason: 'En mutualisation, tous les items sont automatiquement sélectionnés' };
  }
  
  // Envoyé : sélection possible
  if (status === 'SENT') {
    return { canSelect: true, reason: '' };
  }
  
  // Commandé / Clôturé : verrouillé
  if (status === 'ORDERED' || status === 'CLOSED') {
    return { canSelect: false, reason: 'Les items sont verrouillés dans un panier commandé ou clôturé' };
  }
  
  return { canSelect: false, reason: 'Statut de panier inconnu' };
}

/**
 * Vérifie si un item peut être désélectionné
 * @param {Object} basket - Le panier contenant l'item
 * @param {Object} item - L'item à vérifier
 * @param {Array} allBaskets - Tous les paniers actifs pour vérifier les alternatives
 * @returns {Object} { canDeselect: boolean, reason: string }
 */
export function canDeselectItem(basket, item, allBaskets = []) {
  const status = normalizeBasketStatus(basket.status);
  
  // Mutualisation : désélection interdite
  if (status === 'POOLING') {
    return { canDeselect: false, reason: 'La désélection est interdite en mutualisation' };
  }
  
  // Commandé / Clôturé : verrouillé
  if (status === 'ORDERED' || status === 'CLOSED') {
    return { canDeselect: false, reason: 'Les items sont verrouillés dans un panier commandé ou clôturé' };
  }
  
  // Envoyé : vérifier qu'il existe une alternative
  if (status === 'SENT') {
    const purchaseRequestUid = item.purchase_request_uid || item.purchaseRequestUid;
    
    if (!purchaseRequestUid) {
      return { canDeselect: false, reason: 'Item sans UID de demande d\'achat' };
    }
    
    // Chercher un autre panier actif avec le même UID
    const hasAlternative = allBaskets.some(otherBasket => {
      // Ne pas compter le panier courant
      if (otherBasket.id === basket.id) return false;
      
      // Vérifier que le panier est actif (pas clôturé)
      const otherStatus = normalizeBasketStatus(otherBasket.status);
      if (otherStatus === 'CLOSED') return false;
      
      // Chercher un item avec le même UID dans ce panier
      return (otherBasket.lines || []).some(line => {
        const lineUid = line.purchase_request_uid || line.purchaseRequestUid;
        return lineUid === purchaseRequestUid;
      });
    });
    
    if (!hasAlternative) {
      return { 
        canDeselect: false, 
        reason: 'Impossible de désélectionner : aucun autre panier actif ne contient cette demande d\'achat' 
      };
    }
    
    return { canDeselect: true, reason: '' };
  }
  
  return { canDeselect: false, reason: 'Statut de panier inconnu' };
}

/**
 * Vérifie si des items peuvent être purgés (supprimés du panier)
 * @param {Object} basket - Le panier
 * @returns {Object} { canPurge: boolean, reason: string }
 */
export function canPurgeItems(basket) {
  const status = normalizeBasketStatus(basket.status);
  
  // Mutualisation : aucune purge possible
  if (status === 'POOLING') {
    return { canPurge: false, reason: 'Aucune purge possible en mutualisation' };
  }
  
  // Commandé / Clôturé : verrouillé
  if (status === 'ORDERED' || status === 'CLOSED') {
    return { canPurge: false, reason: 'Impossible de purger un panier commandé ou clôturé' };
  }
  
  // Envoyé : pas de purge automatique (les items désélectionnés restent visibles)
  if (status === 'SENT') {
    return { canPurge: false, reason: 'En statut envoyé, les items désélectionnés restent visibles' };
  }
  
  return { canPurge: false, reason: 'Statut de panier inconnu' };
}

/**
 * Vérifie si une transition de statut est possible
 * @param {Object} basket - Le panier
 * @param {string} targetStatus - Le statut cible
 * @param {Object} itemSelectionState - État de sélection des items { itemId: boolean }
 * @param {Array} allBaskets - Tous les paniers actifs
 * @returns {Object} { canTransition: boolean, reason: string, itemsToRemove: Array }
 */
export function canTransitionBasket(basket, targetStatus, itemSelectionState = {}, allBaskets = []) {
  const currentStatus = normalizeBasketStatus(basket.status);
  const normalizedTarget = normalizeBasketStatus(targetStatus);
  
  // POOLING → SENT
  if (currentStatus === 'POOLING' && normalizedTarget === 'SENT') {
    const lines = basket.lines || [];
    const deselectedItems = lines.filter(line => !itemSelectionState[line.id]);
    
    // Vérifier que tous les items désélectionnés ont une alternative
    // (en fait en mutualisation, tous doivent être sélectionnés, mais on garde la logique)
    const itemsWithoutAlternative = deselectedItems.filter(item => {
      const purchaseRequestUid = item.purchase_request_uid || item.purchaseRequestUid;
      if (!purchaseRequestUid) return true;
      
      return !allBaskets.some(otherBasket => {
        if (otherBasket.id === basket.id) return false;
        const otherStatus = normalizeBasketStatus(otherBasket.status);
        if (otherStatus === 'CLOSED') return false;
        
        return (otherBasket.lines || []).some(line => {
          const lineUid = line.purchase_request_uid || line.purchaseRequestUid;
          return lineUid === purchaseRequestUid;
        });
      });
    });
    
    if (itemsWithoutAlternative.length > 0) {
      return {
        canTransition: false,
        reason: `${itemsWithoutAlternative.length} item(s) désélectionné(s) sans alternative dans un autre panier`,
        itemsToRemove: []
      };
    }
    
    return {
      canTransition: true,
      reason: '',
      itemsToRemove: deselectedItems.map(item => ({
        id: item.id,
        purchaseRequestUid: item.purchase_request_uid || item.purchaseRequestUid,
        shouldReturnToDispatch: true
      }))
    };
  }
  
  // SENT → ORDERED
  if (currentStatus === 'SENT' && normalizedTarget === 'ORDERED') {
    const lines = basket.lines || [];
    const deselectedItems = lines.filter(line => !itemSelectionState[line.id]);
    
    // Vérifier qu'aucun item désélectionné n'est sans alternative
    const itemsWithoutAlternative = deselectedItems.filter(item => {
      const purchaseRequestUid = item.purchase_request_uid || item.purchaseRequestUid;
      if (!purchaseRequestUid) return true;
      
      return !allBaskets.some(otherBasket => {
        if (otherBasket.id === basket.id) return false;
        const otherStatus = normalizeBasketStatus(otherBasket.status);
        if (otherStatus === 'CLOSED') return false;
        
        return (otherBasket.lines || []).some(line => {
          const lineUid = line.purchase_request_uid || line.purchaseRequestUid;
          return lineUid === purchaseRequestUid && itemSelectionState[line.id] !== false;
        });
      });
    });
    
    if (itemsWithoutAlternative.length > 0) {
      return {
        canTransition: false,
        reason: `${itemsWithoutAlternative.length} item(s) désélectionné(s) sans alternative valide. Impossible de passer en commandé.`,
        itemsToRemove: []
      };
    }
    
    return {
      canTransition: true,
      reason: 'Tous les items sont validés',
      itemsToRemove: []
    };
  }
  
  // Autres transitions : à implémenter si besoin
  return {
    canTransition: false,
    reason: `Transition ${currentStatus} → ${normalizedTarget} non supportée`,
    itemsToRemove: []
  };
}

/**
 * Retourne l'état initial de sélection des items selon le statut du panier
 * @param {Object} basket - Le panier
 * @returns {Object} État de sélection { itemId: boolean }
 */
export function getInitialItemSelection(basket) {
  const status = normalizeBasketStatus(basket.status);
  const lines = basket.lines || [];
  const selection = {};
  
  // En mutualisation : tous les items sont sélectionnés
  if (status === 'POOLING') {
    lines.forEach(line => {
      selection[line.id] = true;
    });
    return selection;
  }
  
  // En envoyé : utiliser le champ is_selected ou true par défaut
  if (status === 'SENT') {
    lines.forEach(line => {
      selection[line.id] = line.is_selected !== false;
    });
    return selection;
  }
  
  // Commandé / Clôturé : tous verrouillés (considérés comme sélectionnés)
  if (status === 'ORDERED' || status === 'CLOSED') {
    lines.forEach(line => {
      selection[line.id] = true;
    });
    return selection;
  }
  
  return selection;
}

/**
 * Vérifie si un item est modifiable (quantité, prix, etc.)
 * @param {Object} basket - Le panier contenant l'item
 * @returns {boolean}
 */
export function canModifyItem(basket) {
  const status = normalizeBasketStatus(basket.status);
  
  // Commandé / Clôturé : verrouillé
  if (status === 'ORDERED' || status === 'CLOSED') {
    return false;
  }
  
  // Mutualisation / Envoyé : modification possible
  return true;
}
