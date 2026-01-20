/**
 * @fileoverview Utilitaires pour recalculer les lignes des commandes fournisseurs
 * @module lib/purchasing/lineCalculationUtils
 */

import { suppliers } from '@/lib/api/facade';

/**
 * Recalcule les totaux et quantités pour toutes les lignes d'une commande
 * Utile pour corriger les incohérences de calcul
 *
 * @param {string} orderId - ID de la commande
 * @returns {Promise<void>}
 */
export const recalculateOrderLineTotals = async (orderId) => {
  try {
    const lines = await suppliers.fetchSupplierOrderLines(orderId);

    // Recalculer le total pour chaque ligne (unit_price × quantity)
    const updatePromises = lines.map((line) => {
      const unitPrice = line.unit_price || 0;
      const quantity = line.quantity || 0;
      const calculatedTotal = unitPrice * quantity;

      // Seulement mettre à jour si le calcul change
      if (calculatedTotal !== line.total_price) {
        return suppliers.updateSupplierOrderLine(line.id, {
          total_price: calculatedTotal,
          updated_at: new Date().toISOString(),
        });
      }
      return Promise.resolve();
    });

    await Promise.all(updatePromises);
    console.log(`✅ ${lines.length} ligne(s) recalculée(s) pour la commande ${orderId}`);
  } catch (error) {
    console.error('Erreur lors du recalcul des totaux:', error);
    throw error;
  }
};

/**
 * Recalcule les totaux pour TOUTES les commandes
 * Utile pour une correction globale
 *
 * @param {Array} supplierOrders - Toutes les commandes
 * @returns {Promise<{success: number, failed: number, errors: Array}>}
 */
export const recalculateAllOrderTotals = async (supplierOrders) => {
  const results = {
    success: 0,
    failed: 0,
    errors: [],
  };

  try {
    for (const order of supplierOrders) {
      try {
        await recalculateOrderLineTotals(order.id);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          orderId: order.id,
          orderNumber: order.order_number,
          error: error.message,
        });
        console.error(`Erreur pour commande ${order.order_number}:`, error);
      }
    }

    console.log(
      `✅ Recalcul terminé: ${results.success} succès, ${results.failed} erreur(s)`
    );
  } catch (error) {
    console.error('Erreur critique lors du recalcul global:', error);
    throw error;
  }

  return results;
};

/**
 * Recalcule les quantités reçues pour une commande
 * Utile si quantity_received n'a pas été mis à jour correctement
 *
 * @param {string} orderId - ID de la commande
 * @param {Array} lines - Lignes de la commande (optionnel)
 * @returns {Promise<void>}
 */
export const recalculateReceivedQuantities = async (orderId, lines = null) => {
  try {
    const linesToProcess = lines || (await suppliers.fetchSupplierOrderLines(orderId));

    // Pour les lignes reçues, recalculer quantity_received
    const updatePromises = linesToProcess
      .filter((line) => line.quantity_received !== undefined)
      .map((line) => {
        // Si quantity_received > quantity, le réduire
        const correctedQty = Math.min(line.quantity_received, line.quantity);

        if (correctedQty !== line.quantity_received) {
          return suppliers.updateSupplierOrderLine(line.id, {
            quantity_received: correctedQty,
            updated_at: new Date().toISOString(),
          });
        }
        return Promise.resolve();
      });

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises);
      console.log(`✅ ${updatePromises.length} quantité(s) reçue(s) recalculée(s)`);
    }
  } catch (error) {
    console.error('Erreur lors du recalcul des quantités reçues:', error);
    throw error;
  }
};
