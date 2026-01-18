/**
 * @fileoverview Handler pour changement de statut de panier
 * @module components/purchase/orders/supplierOrdersHandlers/statusChangeHandler
 */

import { suppliers, stock } from '@/lib/api/facade';
import { STATUS_MAPPING } from '../supplierOrdersConfig';
import {
  hasAnySelectedLine,
  handlePurgeUnselectedLines,
  updatePurchaseRequestStatuses,
} from './helpers';

/**
 * Gère la transition vers le statut RECEIVED avec validation de sélection
 */
const handleReceivedTransition = async (lines, showError) => {
  if (!hasAnySelectedLine(lines)) {
    showError(
      new Error(
        'Aucune ligne sélectionnée. Veuillez sélectionner au moins un article avant de passer la commande.'
      )
    );
    return false;
  }

  const unselectedPRs = await handlePurgeUnselectedLines(lines, showError);
  if (unselectedPRs.length > 0) {
    await Promise.all(
      unselectedPRs.map((prId) => stock.updatePurchaseRequest(prId, { status: 'in_progress' }))
    );
  }

  return true;
};

/**
 * Gère le changement de statut d'un panier fournisseur avec cascade de mise à jour des DA
 *
 * RÈGLES MÉTIER :
 * - Avant de passer à RECEIVED, au moins une ligne doit être sélectionnée (is_selected = true)
 * - Si passage à RECEIVED, les lignes non sélectionnées sont supprimées et les DA redispatchers
 * - Tous les changements de statut mettent à jour le statut des DA (demandes d'achat) associées
 *
 * @param {string} orderId - ID du panier à modifier
 * @param {string} newStatus - Nouveau statut (OPEN, SENT, ACK, RECEIVED, CLOSED, CANCELLED)
 * @param {Function} onRefresh - Callback pour rafraîchir les données du parent
 * @param {number} expandedOrderId - ID du panier actuellement déplié (pour reload local)
 * @param {Function} setLoading - Setter pour état de chargement
 * @param {Function} setOrderLines - Setter pour les lignes du panier déplié
 * @param {Function} showError - Fonction d'affichage des erreurs et notifications
 * @returns {Promise<void>}
 */
export const handleStatusChange = async (
  orderId,
  newStatus,
  onRefresh,
  expandedOrderId,
  setLoading,
  setOrderLines,
  showError
) => {
  try {
    setLoading(true);

    const lines = await suppliers.fetchSupplierOrderLines(orderId);
    const daStatus = STATUS_MAPPING[newStatus];

    if (!daStatus) {
      console.error('Statut invalide:', newStatus);
      return;
    }

    // Vérification + purge spécifiques au passage RECEIVED
    if (newStatus === 'RECEIVED') {
      const okToProceed = await handleReceivedTransition(lines, showError);
      if (!okToProceed) {
        setLoading(false);
        return;
      }
    }

    // Mise à jour des statuts des DA pour tous les changements de statut
    await updatePurchaseRequestStatuses(lines, daStatus);

    // Mise à jour du panier
    const updateData = { status: newStatus };
    if (newStatus === 'SENT') updateData.ordered_at = new Date().toISOString();
    else if (newStatus === 'CLOSED') updateData.received_at = new Date().toISOString();

    await suppliers.updateSupplierOrder(orderId, updateData);
    await onRefresh();

    if (expandedOrderId === orderId) {
      const updatedLines = await suppliers.fetchSupplierOrderLines(orderId);
      setOrderLines(updatedLines);
    }
  } catch (error) {
    console.error('Erreur changement statut:', error);
    showError(error instanceof Error ? error : new Error('Erreur lors du changement de statut'));
  } finally {
    setLoading(false);
  }
};
