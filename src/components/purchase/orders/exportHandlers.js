/**
 * @fileoverview Handlers d'export pour les commandes fournisseurs
 * Gère l'export CSV, email, et copie HTML
 *
 * @module purchase/orders/exportHandlers
 * @requires @/lib/utils/exportGenerator
 * @requires @/lib/api/facade
 */

import { getOrderNumber, getSupplierObj } from './supplierOrdersConfig';
import { CSV_CONFIG, EMAIL_CONFIG } from '@/config/exportConfig';
import {
  generateCSVContent,
  generateEmailBody,
  generateFullEmailHTML,
} from '@/lib/utils/exportGenerator';

/**
 * Factory pour créer le handler d'export CSV
 *
 * @param {Function} getOrderLines - Fonction pour récupérer les lignes d'une commande
 * @param {Function} showError - Fonction d'affichage des erreurs
 * @returns {Function} Handler d'export CSV - prend un order et exporte en CSV
 *
 * @example
 * const handleExport = createHandleExportCSV(getOrderLines, showError);
 * await handleExport(order);
 *
 * @throws {Error} Si la récupération des lignes échoue
 */
export const createHandleExportCSV = (getOrderLines, showError) => async (order) => {
  try {
    const lines = await getOrderLines(order.id, { forceRefresh: true });
    const csvContent = generateCSVContent(lines);
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
 * Factory pour créer le handler d'envoi email
 *
 * @param {Function} getOrderLines - Fonction pour récupérer les lignes d'une commande
 * @param {Function} showError - Fonction d'affichage des erreurs
 * @returns {Function} Handler d'envoi email - prend un order et ouvre le client email
 *
 * @example
 * const handleEmail = createHandleSendEmail(getOrderLines, showError);
 * await handleEmail(order);
 *
 * @throws {Error} Si la génération du corps d'email échoue
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
 * Factory pour créer le handler de copie email HTML
 *
 * Gère la copie du contenu HTML email dans le presse-papiers avec fallbacks
 * pour navigateurs sans support Clipboard API (HTTP, anciens navigateurs)
 *
 * @param {Function} getOrderLines - Fonction pour récupérer les lignes d'une commande
 * @param {Function} showError - Fonction d'affichage des erreurs et succès
 * @returns {Function} Handler de copie - prend un order et copie l'email en HTML
 *
 * @example
 * const handleCopy = createHandleCopyHTMLEmail(getOrderLines, showError);
 * await handleCopy(order);
 *
 * @throws {Error} Si la génération du contenu HTML échoue
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
