/**
 * @fileoverview Handlers pour les opérations de SupplierOrdersTable
 * Contient la logique d'export (CSV, email) et les changements de statut
 */

import { getOrderNumber, getSupplierObj } from './supplierOrdersConfig';
import { CSV_CONFIG, EMAIL_CONFIG } from '@/config/exportConfig';
import {
  generateCSVContent,
  generateEmailBody,
  generateFullEmailHTML,
} from '@/lib/utils/exportGenerator';
import { suppliers, stock, client } from '@/lib/api/facade';

/**
 * Handle CSV export for supplier order
 * @param {Object} order - Order to export
 * @param {Function} getOrderLines - Function to fetch order lines
 * @param {Function} showError - Error notification
 */
export const createHandleExportCSV = (getOrderLines, showError) => async (order) => {
  try {
    const lines = await getOrderLines(order.id, { forceRefresh: true });
    const csvContent = generateCSVContent(order, lines);
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = CSV_CONFIG.fileNamePattern(
      getOrderNumber(order),
      getSupplierObj(order)?.name || 'fournisseur'
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    showError(error instanceof Error ? error : new Error("Erreur lors de l'export CSV"));
  }
};

/**
 * Handle send email for supplier order
 * @param {Object} order - Order to email
 * @param {Function} getOrderLines - Function to fetch order lines
 * @param {Function} showError - Error notification
 */
export const createHandleSendEmail = (getOrderLines, showError) => async (order) => {
  try {
    const lines = await getOrderLines(order.id, { forceRefresh: true });
    const subject = EMAIL_CONFIG.subject(getOrderNumber(order));
    const bodyText = generateEmailBody(order, lines);
    const mailtoLink = `mailto:${getSupplierObj(order)?.email || ''}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(bodyText)}`;
    window.location.href = mailtoLink;
  } catch (error) {
    showError(
      error instanceof Error ? error : new Error("Erreur lors de la préparation de l'email")
    );
  }
};

/**
 * Handle copy HTML email to clipboard
 * @param {Object} order - Order to email
 * @param {Function} getOrderLines - Function to fetch order lines
 * @param {Function} showError - Error notification
 */
export const createHandleCopyHTMLEmail = (getOrderLines, showError) => async (order) => {
  try {
    const lines = await getOrderLines(order.id, { forceRefresh: true });
    const htmlContent = generateFullEmailHTML(order, lines);
    const textContent = generateEmailBody(order, lines);

    // Check if Clipboard API is available (requires HTTPS or localhost)
    if (navigator.clipboard && navigator.clipboard.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([htmlContent], { type: 'text/html' }),
          'text/plain': new Blob([textContent], { type: 'text/plain' }),
        }),
      ]);
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      // Fallback: copy as plain text
      await navigator.clipboard.writeText(htmlContent);
    } else {
      // Fallback: use deprecated execCommand (for older browsers or HTTP)
      const textArea = document.createElement('textarea');
      textArea.value = htmlContent;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }

    showError(new Error('Email HTML copié ! Collez-le (Ctrl+V) dans votre client email.'));
  } catch (error) {
    showError(error instanceof Error ? error : new Error('Erreur lors de la copie'));
  }
};

/**
 * Status mapping for order lifecycle
 * Mappe le statut du panier fournisseur au statut de la demande d'achat (DA)
 * 
 * OPEN → in_progress : Panier ouvert, en attente de consultation (pas de consultation lancée)
 * SENT → ordered : Consultation lancée, réponses fournisseurs en attente
 * ACK → ordered : Réponse reçue d'au moins un fournisseur, consultation toujours active
 * RECEIVED → ordered : Phase de réception du panier, consultation toujours en cours
 * CLOSED → received : Panier clôturé, commande reçue, consultation terminée
 * CANCELLED → cancelled : Panier annulé
 */
const STATUS_MAPPING = {
  OPEN: 'in_progress',
  SENT: 'ordered',
  ACK: 'ordered',
  RECEIVED: 'ordered',
  CLOSED: 'received',
  CANCELLED: 'cancelled',
};

/**
 * Handle status change with cascade updates
 *
 * RÈGLES MÉTIER (Consultation):
 * - Avant de passer un panier à l'état ORDERED, vérifier qu'au moins une ligne a is_selected = true
 * - Seules les lignes sélectionnées sont commandées
 * - Les lignes non sélectionnées sont ignorées ou marquées rejetées
 *
 * @param {string} orderId - Order ID
 * @param {string} newStatus - New status
 * @param {Array} orders - All orders
 * @param {Function} onRefresh - Refresh callback
 * @param {number} expandedOrderId - Currently expanded order
 * @param {Function} setLoading - Set loading state
 * @param {Function} setOrderLines - Set order lines state
 * @param {Function} showError - Error notification
 */
export const handleStatusChange = async (
  orderId,
  newStatus,
  orders,
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

    // CONSULTATION: Vérification avant passage à RECEIVED (commandé)
    // S'assurer qu'au moins une ligne est sélectionnée
    if (newStatus === 'RECEIVED') {
      const hasAnySelection = lines.some((l) => l.is_selected || l.isSelected);

      if (!hasAnySelection) {
        showError(
          new Error(
            'Aucune ligne sélectionnée. Veuillez sélectionner au moins un article avant de passer la commande.'
          )
        );
        setLoading(false);
        return;
      }
    }

    // PURGE: Si passage à RECEIVED, supprimer les lignes non sélectionnées et redispatcher les DA
    if (newStatus === 'RECEIVED') {
      const unselectedLines = lines.filter((l) => !(l.is_selected || l.isSelected));
      
      if (unselectedLines.length > 0) {
        // Message d'alerte conforme à la convention
        const unselectedCount = unselectedLines.length;
        const unselectedItems = unselectedLines
          .map((l) => l.stock_item_id?.name || l.stock_item_id?.ref || 'Article')
          .slice(0, 3)
          .join(', ');
        const more = unselectedLines.length > 3 ? ` et ${unselectedLines.length - 3} autre(s)` : '';
        
        showError(
          new Error(
            `⚠️ Purge de ${unselectedCount} ligne(s) non sélectionnée(s): ${unselectedItems}${more}. ` +
            `Ces articles seront redispatchers si présents dans d'autres paniers.`
          )
        );

        // Récupérer toutes les DA associées aux lignes non sélectionnées
        const unselectedPRs = Array.from(
          new Set(
            unselectedLines.flatMap((line) => {
              const prs = line.purchase_requests ?? line.purchaseRequests ?? [];
              return prs.map((pr) => {
                const prField = pr.purchase_request_id ?? pr.purchaseRequest;
                if (prField && typeof prField === 'object') return prField.id;
                return prField || null;
              });
            })
          )
        ).filter(Boolean);

        console.log('[StatusChange] Unselected PR IDs for redispatch:', unselectedPRs);

        // Supprimer les lignes non sélectionnées via l'API Directus
        await Promise.all(
          unselectedLines.map((line) => 
            // Supprimer directement via l'API client
            client.api.delete(`/items/supplier_order_line/${line.id}`)
          )
        );

        // Redispatcher les DA (les remettre en statut 'in_progress' pour nouvelle consultation)
        if (unselectedPRs.length > 0) {
          await Promise.all(
            unselectedPRs.map((prId) => 
              stock.updatePurchaseRequest(prId, { status: 'in_progress' })
            )
          );
        }
      }
    }

    // Mettre à jour le statut des DA (demandes d'achat) liées à ce panier
    // Cette opération se fait pour TOUS les changements de statut, pas seulement SENT/RECEIVED
    const allRequests = Array.from(
      new Set(
        lines.flatMap((line) => {
          const prs = line.purchaseRequests ?? line.purchase_requests ?? [];
          console.log('[handleStatusChange] Line:', line.id, 'Purchase requests:', prs);
          return prs.map((pr) => {
            const prField = pr.purchaseRequest ?? pr.purchase_request_id;
            console.log('[handleStatusChange] PR:', pr, 'prField:', prField);
            if (prField && typeof prField === 'object') return prField.id;
            return prField || null;
          });
        })
      )
    ).filter(Boolean);

    console.log('[handleStatusChange] All PR IDs to update:', allRequests, 'with status:', daStatus);

    if (allRequests.length > 0) {
      await Promise.all(
        allRequests.map((prId) => stock.updatePurchaseRequest(prId, { status: daStatus }))
      );
    }

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

/**
 * Re-evaluate DA statuses for a supplier order
 * TEMPORARY FIX: Allows manual synchronization of DA statuses with supplier order status
 * TODO: Remove after v1.5 when DA sync is fixed in core handler
 *
 * @param {Object} order - Order object with id and status
 * @param {Function} onRefresh - Refresh callback
 * @param {Function} setLoading - Set loading state
 * @param {Function} showError - Error notification
 */
export const handleReEvaluateDA = async (order, onRefresh, setLoading, showError) => {
  try {
    setLoading(true);

    const lines = await suppliers.fetchSupplierOrderLines(order.id);
    const daStatus = STATUS_MAPPING[order.status.toUpperCase()];

    if (!daStatus) {
      console.error('STATUS_MAPPING ne couvre pas le statut:', order.status);
      console.error('Statuts disponibles:', Object.keys(STATUS_MAPPING));
      showError(new Error(`Impossible de déterminer le statut des DA pour le statut "${order.status}"`));
      return;
    }

    // Debug: afficher la structure des lignes
    console.log('[ReEvaluateDA] Nombre de lignes:', lines.length);
    console.log('[ReEvaluateDA] Structure première ligne:', lines[0]);

    // Mettre à jour le statut des DA (demandes d'achat) liées à ce panier
    const allRequests = Array.from(
      new Set(
        lines.flatMap((line) => {
          // Dans v1.5.x, les DA sont dans purchase_requests (table M2M supplier_order_line_purchase_request)
          const prs = line.purchase_requests ?? [];
          console.log('[ReEvaluateDA] Line ID:', line.id, 'Purchase requests:', prs);
          return prs.map((pr) => {
            // La structure M2M contient purchase_request_id qui pointe vers la DA
            const prField = pr.purchase_request_id;
            console.log('[ReEvaluateDA] PR:', pr, 'prField:', prField);
            if (prField && typeof prField === 'object') return prField.id;
            return prField || null;
          });
        })
      )
    ).filter(Boolean);

    console.log('[ReEvaluateDA] DA trouvées:', allRequests);

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
    showError(new Error(`✅ ${allRequests.length} DA(s) réévaluée(s) avec succès`));
  } catch (error) {
    console.error('Erreur réévaluation DA:', error);
    showError(
      error instanceof Error
        ? error
        : new Error('Erreur lors de la réévaluation des DA')
    );
  } finally {
    setLoading(false);
  }
};
