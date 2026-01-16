/**
 * Opérations sur les items de panier
 * Fonctions utilitaires pour supprimer des items et mettre à jour les demandes d'achat
 */

import { suppliers } from "@/lib/api/facade";

/**
 * Supprime un item du panier et retourne la demande d'achat à l'état "à dispatcher"
 * @param {string} lineId - ID de la ligne à supprimer
 * @param {string} purchaseRequestUid - UID de la demande d'achat associée
 * @returns {Promise<Object>} Résultat { success: boolean, error?: string }
 */
export async function deleteBasketLineAndResetRequest(lineId, purchaseRequestUid) {
  try {
    // Supprimer la ligne du panier
    await suppliers.deleteSupplierOrderLine(lineId);
    
    // Retourner la demande d'achat à l'état "open" (à dispatcher)
    // NOTE: Cette API n'existe pas encore, à implémenter côté backend
    // await purchases.updateStatus(purchaseRequestUid, 'open');
    
    return { success: true };
  } catch (error) {
    console.error(`Erreur suppression ligne ${lineId}:`, error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erreur inconnue' 
    };
  }
}

/**
 * Met à jour le statut d'un panier
 * @param {string} basketId - ID du panier
 * @param {string} newStatus - Nouveau statut (SENT, ACK, RECEIVED, CLOSED, CANCELLED)
 * @returns {Promise<Object>} Panier mis à jour ou erreur
 */
export async function updateBasketStatus(basketId, newStatus) {
  try {
    // NOTE: Cette API n'existe pas encore, à implémenter côté backend
    // return await suppliers.updateSupplierOrder(basketId, { status: newStatus });
    console.log(`API manquante: updateSupplierOrder(${basketId}, { status: ${newStatus} })`);
    throw new Error('API updateSupplierOrder non implémentée');
  } catch (error) {
    console.error(`Erreur mise à jour statut panier ${basketId}:`, error);
    throw error;
  }
}

/**
 * Valide et exécute une transition de statut avec all les vérifications
 * @param {Object} basket - Le panier
 * @param {string} newStatus - Nouveau statut cible
 * @param {Object} itemSelectionState - État de sélection des items
 * @param {Array} allBaskets - Tous les paniers actifs
 * @param {Array} purchaseRequests - Toutes les demandes d'achat (pour refs et nettoyage)
 * @returns {Promise<Object>} { success: boolean, message: string, removedItemsCount?: number }
 */
export async function executeBasketTransition(
  basket,
  newStatus,
  itemSelectionState = {},
  allBaskets = [],
  purchaseRequests = []
) {
  const { canTransitionBasket } = await import('./basketItemRules');
  
  // Vérifier la possibilité de transition
  const transitionResult = canTransitionBasket(
    basket,
    newStatus,
    itemSelectionState,
    allBaskets
  );

  if (!transitionResult.canTransition) {
    return {
      success: false,
      message: transitionResult.reason
    };
  }

  try {
    let removedCount = 0;

    // Supprimer les items non sélectionnés et retourner les DAs
    if (transitionResult.itemsToRemove.length > 0) {
      for (const item of transitionResult.itemsToRemove) {
        const result = await deleteBasketLineAndResetRequest(item.id, item.purchaseRequestUid);
        if (result.success) {
          removedCount++;
        } else {
          console.warn(`Échec suppression item ${item.id}: ${result.error}`);
        }
      }
    }

    // Mettre à jour le statut du panier
    await updateBasketStatus(basket.id, newStatus);

    return {
      success: true,
      message: `Panier transitionné vers ${newStatus}`,
      removedItemsCount: removedCount
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Erreur lors de la transition'
    };
  }
}
