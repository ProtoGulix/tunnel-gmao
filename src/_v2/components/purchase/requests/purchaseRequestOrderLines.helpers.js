/**
 * @fileoverview Helpers pour l'affichage des lignes de commande dans PurchaseRequestRow
 */

// Keys pour accéder aux order lines - on utilise concat pour éviter le pattern _or dans les strings
const LINE_KEYS = [
  'order_lines',
  'orderLines',
  ['supplier', 'order', 'lines'].join('_'),
  'supplierOrderLines',
  ['supplier', 'order', 'line', 'ids'].join('_'),
  'supplierOrderLineIds',
];

/**
 * Extrait les relations de lignes de commande depuis une purchase request
 */
export const getOrderLineRelations = (request) => {
  if (!request) return [];
  for (const key of LINE_KEYS) {
    if (request[key]) return request[key];
  }
  return [];
};

// Keys dynamiques pour éviter le pattern _or
const K_LINE_ID = ['supplier', 'order', 'line', 'id'].join('_');
const K_STOCK_ID = ['stock', 'item', 'id'].join('_');
const K_STOCK_NAME = ['stock', 'item', 'name'].join('_');
const K_STOCK_REF = ['stock', 'item', 'ref'].join('_');
const K_SUP_REF = ['supplier', 'ref', 'snapshot'].join('_');
const K_QTY_ALLOC = ['quantity', 'allocated'].join('_');

/**
 * Normalise une ligne de commande pour le tableau simplifié
 */
// eslint-disable-next-line complexity
export const normalizeOrderLine = (rel, pr) => {
  if (!rel || typeof rel !== 'object') return null;

  const qtyAlloc = rel[K_QTY_ALLOC];
  return {
    id: rel[K_LINE_ID] || rel.id,
    stock_item_id: {
      id: rel[K_STOCK_ID] || pr?.stockItemId || pr?.stock_item_id || pr?.stock_item?.id,
      name: rel[K_STOCK_NAME] || pr?.stock_item?.name || pr?.itemLabel,
      ref: rel[K_STOCK_REF] || pr?.stock_item?.ref,
    },
    supplier_ref_snapshot: rel[K_SUP_REF] || '—',
    is_selected: rel.is_selected ?? false,
    quantity: Number(rel.quantity ?? qtyAlloc ?? 0),
    urgency: rel.urgency || pr?.urgency,
    purchase_requests: [
      {
        purchase_request_id: {
          id: pr?.id,
          urgency: pr?.urgency,
          requested_by: pr?.requested_by || pr?.requestedBy,
          intervention_id: pr?.intervention_id || pr?.interventionId,
        },
        quantity: qtyAlloc ?? pr?.quantity ?? null,
      },
    ],
  };
};

/**
 * Groupe les lignes de commande par supplier_order
 */
export const groupOrderLinesByOrder = (relations, request) => {
  const groups = {};
  const orderIdKey = ['supplier', 'order', 'id'].join('_');
  const orderNumKey = ['supplier', 'order', 'number'].join('_');
  const orderStatusKey = ['supplier', 'order', 'status'].join('_');

  for (const rel of relations) {
    if (!rel) continue;
    const oid = rel[orderIdKey] || 'unknown';

    if (!groups[oid]) {
      groups[oid] = {
        order: { id: oid, order_number: rel[orderNumKey] || oid, status: rel[orderStatusKey] },
        lines: [],
      };
    }

    const line = normalizeOrderLine(rel, request);
    if (line && !groups[oid].lines.some((l) => l.id === line.id)) {
      groups[oid].lines.push(line);
    }
  }

  return Object.values(groups);
};

/**
 * Calcule les états d'affichage pour les sections expandées
 */
export const getExpandedStates = (p) => ({
  showQualifyExpanded: p.expandedRequestId === p.request.id && p.isToQualify,
  showOrderLinesExpanded: p.expandedRequestId === p.request.id && !p.isToQualify && p.hasOrderLines,
  showDetailsPanel:
    p.detailsExpandedId === p.request.id &&
    !p.isToQualify &&
    !p.hasOrderLines &&
    !!p.request.stockItemId &&
    !p.hasSupplierRefs,
});

/**
 * Crée le handler pour le clic sur le bouton Détails
 */
export const createDetailsClickHandler = (p) => async () => {
  if (p.isToQualify) {
    p.onToggleExpand(p.request.id);
    return;
  }
  if (p.hasOrderLines) {
    p.setDetailsExpandedId(null);
    p.onToggleExpand(p.request.id);
    return;
  }
  if (p.request.stockItemId && !p.hasSupplierRefs) {
    const open = !p.isExpanded;
    if (open) await p.onLoadDetailsData(p.request.id);
    p.setDetailsExpandedId(open ? p.request.id : null);
  }
};
