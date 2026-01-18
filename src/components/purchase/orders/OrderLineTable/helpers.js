/**
 * @fileoverview DTO accessors et utilitaires pour OrderLineTable
 * @module components/purchase/orders/OrderLineTable/helpers
 */

/**
 * Récupère l'objet stock d'une ligne
 * @param {Object} line - Ligne de commande
 * @returns {Object|null} Objet stock
 */
export const getStock = (line) => line.stockItem ?? line.stock_item_id;

/**
 * Récupère les demandes d'achat (DA) d'une ligne
 * @param {Object} line - Ligne de commande
 * @returns {Array} Tableau des DA
 */
export const getPurchaseRequests = (line) =>
  line?.purchaseRequests ?? line?.purchase_requests ?? [];

/**
 * Récupère un objet DA à partir d'une référence (handle M2M structure)
 * @param {Object} pr - Référence DA
 * @returns {Object|null} Objet DA
 */
export const getPurchaseRequest = (pr) => {
  if (!pr) return null;
  // Handle M2M structure: { id, purchase_request_id: {...} }
  if (pr.purchase_request_id) return pr.purchase_request_id;
  if (pr.purchaseRequest) return pr.purchaseRequest;
  // Direct PR object
  return pr;
};

/**
 * Récupère l'urgence maximale d'une ligne
 * @param {Object} line - Ligne de commande
 * @returns {string} Niveau d'urgence (high, normal, low)
 */
export const getMaxUrgency = (line) => {
  const rank = { high: 3, normal: 2, low: 1 };
  const lineUrgency = line.urgency || line.urgency_level;
  let best = lineUrgency || null;

  getPurchaseRequests(line).forEach((pr) => {
    const prObj = getPurchaseRequest(pr);
    const u = prObj?.urgency;
    if (!u) return;
    if (!best || (rank[u] || 0) > (rank[best] || 0)) {
      best = u;
    }
  });

  return best;
};

/**
 * Extrait le code intervention d'un objet intervention
 * @param {Object} interv - Objet intervention
 * @returns {string|null} Code ou id intervention
 */
export const getIntervCode = (interv) => {
  if (!interv) return null;
  return typeof interv === 'object' ? interv.code || interv.id : interv;
};

/**
 * Récupère les infos intervention d'une ligne
 * @param {Object} line - Ligne de commande
 * @returns {{id: string|null, code: string|null}|null}
 */
export const getInterventionInfo = (line) => {
  const prs = getPurchaseRequests(line);
  const first = getPurchaseRequest(prs[0]);
  if (!first) return null;
  const interv = first.intervention ?? first.intervention_id;
  if (!interv) return null;
  const code = getIntervCode(interv);
  const id = typeof interv === 'object' ? interv.id : interv;
  return { id: id || null, code: code || id || null };
};

/**
 * Récupère le nom du demandeur d'une DA
 * @param {Object} pr - Purchase request
 * @returns {string} Nom du demandeur
 */
export const getRequesterName = (pr) => {
  const prObj = getPurchaseRequest(pr);
  return prObj?.requested_by || prObj?.requestedBy || '—';
};

/**
 * Compte le nombre de DA liées à une ligne
 * @param {Object} line - Ligne de commande
 * @returns {number} Nombre de DA
 */
export const countPurchaseRequests = (line) => {
  const prs = getPurchaseRequests(line);
  return prs.length;
};

/**
 * Détecte si une ligne a des lignes jumelles
 * @param {Object} line - Ligne de commande
 * @returns {{hasTwin: boolean, twinCount: number, totalLines: number}}
 */
export const detectTwinLines = (line) => {
  const prs = getPurchaseRequests(line);
  if (prs.length === 0) {
    return { hasTwin: false, twinCount: 0, totalLines: 0 };
  }

  let maxTotalLines = 0;
  let hasTwin = false;

  prs.forEach((pr) => {
    const prObj = getPurchaseRequest(pr);
    if (!prObj) return;

    let supplierOrderLineIds = prObj.supplier_order_line_ids || [];
    if (!Array.isArray(supplierOrderLineIds)) {
      supplierOrderLineIds = [];
    }

    const totalLines = supplierOrderLineIds.length;
    if (totalLines > maxTotalLines) {
      maxTotalLines = totalLines;
      if (totalLines > 1) {
        hasTwin = true;
      }
    }
  });

  return {
    hasTwin,
    twinCount: hasTwin ? maxTotalLines - 1 : 0,
    totalLines: maxTotalLines,
  };
};
