/**
 * @fileoverview Helpers pour la gestion des DA et lignes de panier
 * @module components/purchase/orders/supplierOrdersHandlers/helpers
 */

import { stock, client } from '@/lib/api/facade';

/**
 * Valide qu'au moins une ligne est sélectionnée
 */
export const hasAnySelectedLine = (lines) => lines.some((l) => l.is_selected || l.isSelected);

/**
 * Extrait les IDs uniques des DA d'une liste de lignes
 */
export const extractPurchaseRequestIds = (lines) => {
  return Array.from(
    new Set(
      lines.flatMap((line) => {
        const prs = line.purchase_requests ?? [];
        return prs.map((pr) => {
          const prField = pr.purchase_request_id;
          if (prField && typeof prField === 'object') return prField.id;
          return prField || null;
        });
      })
    )
  ).filter(Boolean);
};

/**
 * Purge des lignes non sélectionnées et redispatch des DA
 */
export const handlePurgeUnselectedLines = async (lines, showError) => {
  const unselectedLines = lines.filter((l) => !(l.is_selected || l.isSelected));

  if (unselectedLines.length === 0) {
    return [];
  }

  const unselectedCount = unselectedLines.length;
  const unselectedItems = unselectedLines
    .map((l) => l.stock_item_id?.name || l.stock_item_id?.ref || 'Article')
    .slice(0, 3)
    .join(', ');
  const more = unselectedLines.length > 3 ? ` et ${unselectedLines.length - 3} autre(s)` : '';

  showError(
    new Error(
      `Purge de ${unselectedCount} ligne(s) non sélectionnée(s): ${unselectedItems}${more}. ` +
        `Ces articles seront redispatchers si présents dans d'autres paniers.`
    )
  );

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

  await Promise.all(
    unselectedLines.map((line) => client.api.delete(`/items/supplier_order_line/${line.id}`))
  );

  return unselectedPRs;
};

/**
 * Met à jour les statuts des DA
 */
export const updatePurchaseRequestStatuses = async (lines, daStatus) => {
  const allRequests = extractPurchaseRequestIds(lines);
  if (allRequests.length > 0) {
    await Promise.all(
      allRequests.map((prId) => stock.updatePurchaseRequest(prId, { status: daStatus }))
    );
  }
};
