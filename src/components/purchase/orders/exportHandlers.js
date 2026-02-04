/**
 * @fileoverview Handlers d'export pour les commandes fournisseurs
 * Délégués au backend via API
 *
 * @module purchase/orders/exportHandlers
 * @requires @/lib/api/facade
 */

import { supplierOrders } from '@/lib/api/facade';

/**
 * Factory pour créer le handler d'export CSV
 * Délégué au backend
 *
 * @param {Function} showError - Fonction d'affichage des erreurs
 * @returns {Function} Handler d'export CSV - prend un order et exporte en CSV
 *
 * @example
 * const handleExport = createHandleExportCSV(showError);
 * await handleExport(order);
 *
 * @throws {Error} Si l'API échoue
 */
export const createHandleExportCSV = (showError) => async (order) => {
  try {
    const response = await supplierOrders.exportCSV(order.id);

    // Backend retourne un blob ou un objet avec données
    if (response instanceof Blob) {
      const link = document.createElement('a');
      const url = URL.createObjectURL(response);
      link.href = url;
      link.download = response.filename || `demande_prix_${order.orderNumber}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else if (response.data) {
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = response.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    showError(error instanceof Error ? error : new Error("Erreur lors de l'export CSV"));
  }
};

/**
 * Factory pour créer le handler d'envoi email
 * Délégué au backend
 *
 * @param {Function} showError - Fonction d'affichage des erreurs
 * @returns {Function} Handler d'envoi email - prend un order et ouvre le client email
 *
 * @example
 * const handleEmail = createHandleSendEmail(showError);
 * await handleEmail(order);
 *
 * @throws {Error} Si l'API échoue
 */
export const createHandleSendEmail = (showError) => async (order) => {
  try {
    const response = await supplierOrders.exportEmail(order.id, 'text');

    const mailtoLink = `mailto:${response.supplier_email || ''}?subject=${encodeURIComponent(
      response.subject
    )}&body=${encodeURIComponent(response.body_text)}`;
    window.location.href = mailtoLink;
  } catch (error) {
    showError(
      error instanceof Error ? error : new Error("Erreur lors de la préparation de l'email")
    );
  }
};

/**
 * Factory pour créer le handler de copie email HTML
 * Délégué au backend - gère la copie du contenu HTML email dans le presse-papiers
 *
 * @param {Function} showError - Fonction d'affichage des erreurs et succès
 * @returns {Function} Handler de copie - prend un order et copie l'email en HTML
 *
 * @example
 * const handleCopy = createHandleCopyHTMLEmail(showError);
 * await handleCopy(order);
 *
 * @throws {Error} Si l'API échoue
 */
export const createHandleCopyHTMLEmail = (showError) => async (order) => {
  try {
    const response = await supplierOrders.exportEmail(order.id, 'html');

    const { body_html, body_text } = response;

    // Check if Clipboard API is available (requires HTTPS or localhost)
    if (navigator.clipboard && navigator.clipboard.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([body_html], { type: 'text/html' }),
          'text/plain': new Blob([body_text], { type: 'text/plain' }),
        }),
      ]);
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      // Fallback: copy as plain text
      await navigator.clipboard.writeText(body_html);
    } else {
      // Fallback: use deprecated execCommand (for older browsers or HTTP)
      const textArea = document.createElement('textarea');
      textArea.value = body_html;
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
