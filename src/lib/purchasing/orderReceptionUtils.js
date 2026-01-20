/**
 * @fileoverview Utility pour gérer la réception des commandes
 * @module lib/purchasing/orderReceptionUtils
 * 
 * Gère la logique de mise à jour des quantities reçues et des statuts
 * quand une commande passe en reçue/clôturée
 */

import { suppliers, stock } from '@/lib/api/facade';

/**
 * Met à jour les quantity_received pour toutes les lignes d'une commande
 * Quand une commande est clôturée, on considère que toutes les lignes sélectionnées
 * ont été complètement reçues
 *
 * @param {string} orderId - ID de la commande
 * @param {Array} lines - Lignes de la commande (optionnel, sera fetchées si non fourni)
 * @returns {Promise<void>}
 */
export const updateLineQuantitiesReceived = async (orderId, lines = null) => {
  try {
    const linesToUpdate = lines || (await suppliers.fetchSupplierOrderLines(orderId));

    // Mettre à jour quantity_received = quantity pour toutes les lignes sélectionnées
    const updatePromises = linesToUpdate
      .filter((line) => line.is_selected || line.isSelected)
      .map((line) =>
        suppliers.updateSupplierOrderLine(line.id, {
          quantity_received: line.quantity,
          // Si possible, mettre à jour updated_at aussi
          updated_at: new Date().toISOString(),
        })
      );

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
      console.log(
        `✅ ${updatePromises.length} ligne(s) mise(s) à jour avec quantity_received`
      );
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour des quantities reçues:', error);
    // Ne pas relancer l'erreur, c'est une operation secondaire
  }
};

/**
 * Met à jour les demandes d'achat associées en statut "received"
 * Appelé quand une commande passe en "received" ou "closed"
 *
 * @param {Array} lines - Lignes de la commande avec leurs relations
 * @returns {Promise<void>}
 */
export const markPurchaseRequestsAsReceived = async (lines) => {
  try {
    // Récupérer les IDs uniques des purchase_requests liées
    const purchaseRequestIds = Array.from(
      new Set(
        lines
          .filter((line) => line.is_selected || line.isSelected)
          .flatMap((line) => {
            const prs = line.purchase_requests ?? [];
            return prs.map((pr) => {
              const prField = pr.purchase_request_id;
              if (prField && typeof prField === 'object') return prField.id;
              return prField || null;
            });
          })
      )
    ).filter(Boolean);

    if (purchaseRequestIds.length > 0) {
      await Promise.all(
        purchaseRequestIds.map((prId) =>
          stock.updatePurchaseRequest(prId, {
            status: 'received',
            updated_at: new Date().toISOString(),
          })
        )
      );
      console.log(`✅ ${purchaseRequestIds.length} demande(s) d'achat passée(s) en "received"`);
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour des demandes d\'achat:', error);
    // Ne pas relancer l'erreur, c'est une operation secondaire
  }
};

/**
 * Gère la réception complète d'une commande :
 * - Met à jour quantity_received pour les lignes
 * - Met à jour les demandes d'achat en "received"
 *
 * À appeler quand supplier_order passe en "received" ou "closed"
 *
 * @param {string} orderId - ID de la commande
 * @param {Array} lines - Lignes de la commande (optionnel)
 * @returns {Promise<void>}
 */
export const processOrderReception = async (orderId, lines = null) => {
  try {
    const linesToProcess = lines || (await suppliers.fetchSupplierOrderLines(orderId));

    // Étape 1 : Mettre à jour quantities reçues
    await updateLineQuantitiesReceived(orderId, linesToProcess);

    // Étape 2 : Mettre à jour purchase_requests
    await markPurchaseRequestsAsReceived(linesToProcess);

    console.log(`✅ Réception de la commande ${orderId} complètement traitée`);
  } catch (error) {
    console.error('Erreur lors du traitement de la réception:', error);
    throw error;
  }
};
