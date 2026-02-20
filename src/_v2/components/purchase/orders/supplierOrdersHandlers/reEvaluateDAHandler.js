/**
 * @fileoverview Handler pour réévaluation des DA
 * @module components/purchase/orders/supplierOrdersHandlers/reEvaluateDAHandler
 */

import { suppliers, stock } from '@/lib/api/facade';
import { STATUS_MAPPING } from '../supplierOrdersConfig';
import { extractPurchaseRequestIds } from './helpers';

/**
 * Réévalue manuellement les statuts des DA pour synchroniser avec le panier
 *
 * TEMPORAIRE : Cette fonction est un workaround pour synchroniser les DA quand le handler principal échoue.
 * À supprimer après v1.5 quand la synchronisation DA sera implémentée en amont.
 *
 * @param {Object} order - Panier fournisseur
 * @param {string} order.id - ID du panier
 * @param {string} order.status - Statut actuel du panier
 * @param {Function} onRefresh - Callback pour rafraîchir les données
 * @param {Function} setLoading - Setter pour l'état de chargement
 * @param {Function} showError - Fonction d'affichage des erreurs et succès
 * @returns {Promise<void>}
 *
 * @todo Supprimer après v1.5 une fois la synchronisation DA implémentée
 */
export const handleReEvaluateDA = async (order, onRefresh, setLoading, showError) => {
  try {
    setLoading(true);

    const lines = await suppliers.fetchSupplierOrderLines(order.id);
    const daStatus = STATUS_MAPPING[order.status.toUpperCase()];

    if (!daStatus) {
      console.error('STATUS_MAPPING ne couvre pas le statut:', order.status);
      console.error('Statuts disponibles:', Object.keys(STATUS_MAPPING));
      showError(
        new Error(`Impossible de déterminer le statut des DA pour le statut "${order.status}"`)
      );
      return;
    }

    const allRequests = extractPurchaseRequestIds(lines);

    if (allRequests.length === 0) {
      showError(
        new Error(
          `Aucune DA trouvée pour ce panier (${lines.length} ligne(s)). ` +
            `Vérifiez que la table supplier_order_line_purchase_request contient des entrées ` +
            `pour ces lignes, ou que l'API Directus charge bien la relation M2M "purchase_requests".`
        )
      );
      setLoading(false);
      return;
    }

    await Promise.all(
      allRequests.map((prId) => stock.updatePurchaseRequest(prId, { status: daStatus }))
    );

    await onRefresh();
    showError(new Error(`${allRequests.length} DA(s) réévaluée(s) avec succès`));
  } catch (error) {
    console.error('Erreur réévaluation DA:', error);
    showError(error instanceof Error ? error : new Error('Erreur lors de la réévaluation des DA'));
  } finally {
    setLoading(false);
  }
};
