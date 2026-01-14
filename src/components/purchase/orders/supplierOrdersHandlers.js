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
import { suppliers, stock } from '@/lib/api/facade';

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

    // CONSULTATION: Vérification intelligente avant passage à ORDERED
    // - Article avec 1 seul fournisseur → auto-sélection
    // - Article avec plusieurs fournisseurs → sélection obligatoire via Consultation
    if (newStatus === 'SENT' || newStatus === 'RECEIVED') {
      // Grouper les lignes par stock_item_id pour identifier les articles avec plusieurs fournisseurs
      const itemGroups = new Map();

      for (const line of lines) {
        const stockItemId = line.stock_item_id?.id || line.stock_item_id;
        if (!itemGroups.has(stockItemId)) {
          itemGroups.set(stockItemId, []);
        }
        itemGroups.get(stockItemId).push(line);
      }

      // Vérifier chaque article
      const itemsNeedingSelection = [];
      const linesToAutoSelect = [];

      for (const [stockItemId, itemLines] of itemGroups) {
        const hasSelection = itemLines.some((l) => l.is_selected || l.isSelected);

        if (itemLines.length === 1) {
          // Un seul fournisseur pour cet article → auto-sélection si pas déjà sélectionné
          if (!hasSelection) {
            linesToAutoSelect.push(itemLines[0]);
          }
        } else {
          // Plusieurs fournisseurs pour cet article → sélection obligatoire
          if (!hasSelection) {
            const itemName =
              itemLines[0].stock_item_id?.name || itemLines[0].stock_item_id?.ref || 'Article';
            itemsNeedingSelection.push(itemName);
          }
        }
      }

      // Si des articles avec plusieurs fournisseurs n'ont pas de sélection → bloquer
      if (itemsNeedingSelection.length > 0) {
        const itemsList = itemsNeedingSelection.slice(0, 3).join(', ');
        const more =
          itemsNeedingSelection.length > 3
            ? ` et ${itemsNeedingSelection.length - 3} autre(s)`
            : '';

        showError(
          new Error(
            `Certains articles ont plusieurs fournisseurs (${itemsList}${more}). ` +
              `Veuillez passer par l'onglet Consultation pour sélectionner un fournisseur.`
          )
        );
        setLoading(false);
        return;
      }

      // Auto-sélectionner les lignes des articles à fournisseur unique
      if (linesToAutoSelect.length > 0) {
        console.log(
          '[StatusChange] Auto-selecting lines for single-supplier items:',
          linesToAutoSelect.length
        );
        await Promise.all(
          linesToAutoSelect.map((line) =>
            suppliers.updateSupplierOrderLine(line.id, {
              isSelected: true,
            })
          )
        );
      }
    }

    const allRequests = Array.from(
      new Set(
        lines.flatMap((line) => {
          const prs = line.purchaseRequests ?? line.purchase_requests ?? [];
          return prs.map((pr) => {
            const prField = pr.purchaseRequest ?? pr.purchase_request_id;
            if (prField && typeof prField === 'object') return prField.id;
            return prField || null;
          });
        })
      )
    ).filter(Boolean);

    await Promise.all(
      allRequests.map((prId) => stock.updatePurchaseRequest(prId, { status: daStatus }))
    );

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
