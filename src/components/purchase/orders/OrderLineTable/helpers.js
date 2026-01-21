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
 * Extrait les jumelles d'une ligne en groupant par purchase_request.id
 * Jumelles = plusieurs supplier_order_lines avec le même purchase_request.id
 * Utilisé par useTwinLinesValidation et detectTwinLines
 * @param {Object} line - Ligne de commande
 * @returns {{twinLines: Array, twinCount: number, totalLines: number}}
 */
export const extractTwinLinesForLine = (line) => {
  if (!line) {
    return { twinLines: [], twinCount: 0, totalLines: 0 };
  }

  const prs = getPurchaseRequests(line);
  if (prs.length === 0) {
    return { twinLines: [], twinCount: 0, totalLines: 0 };
  }

  const currentLineId = line.id;
  // Grouper par purchase_request.id pour identifier les jumelles
  // Jumelles = tous les supplier_order_lines partageant le même purchase_request.id
  const linesByPrId = new Map();

  prs.forEach((pr) => {
    const prObj = getPurchaseRequest(pr);
    if (!prObj) return;

    const prId = prObj.id;
    const supplierOrderLineIds = prObj.supplier_order_line_ids || [];

    if (!Array.isArray(supplierOrderLineIds)) return;

    supplierOrderLineIds.forEach((item) => {
      const lineData = item.supplier_order_line_id;
      if (!lineData) return;

      // Grouper toutes les lignes par leur purchase_request.id
      if (!linesByPrId.has(prId)) {
        linesByPrId.set(prId, []);
      }
      linesByPrId.get(prId).push(lineData);
    });
  });

  // Extraire les jumelles :
  // - Parcourir chaque groupe de PR
  // - Compter TOUTES les lignes sélectionnées (hors ligne courante)
  // - Ce sont les jumelles actives qu'on doit signaler à l'utilisateur
  const twinsByLineId = new Map();
  linesByPrId.forEach((linesForPr) => {
    // Parcourir toutes les lignes du groupe
    linesForPr.forEach((lineData) => {
      // Garder uniquement les lignes sélectionnées (hors ligne courante)
      if (
        lineData.id !== currentLineId &&
        lineData.is_selected === true &&
        !twinsByLineId.has(lineData.id)
      ) {
        twinsByLineId.set(lineData.id, lineData);
      }
    });
  });

  const twinLines = Array.from(twinsByLineId.values());
  const twinCount = twinLines.length;
  const totalLines = twinCount + 1; // Jumelles + ligne courante

  return {
    twinLines,
    twinCount,
    totalLines,
  };
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
 * Filtre exactement comme le hook useTwinLinesValidation pour éviter les faux positifs
 * @param {Object} line - Ligne de commande
 * @returns {{hasTwin: boolean, twinCount: number, totalLines: number}}
 */
export const detectTwinLines = (line) => {
  const prs = getPurchaseRequests(line);
  if (prs.length === 0) {
    return { hasTwin: false, twinCount: 0, totalLines: 0 };
  }

  // Dédupliquer les jumelles par ID (comme dans le hook)
  const twinsByLineId = new Map();
  const currentLineId = line.id;

  prs.forEach((pr) => {
    const prObj = getPurchaseRequest(pr);
    if (!prObj) return;

    const supplierOrderLineIds = prObj.supplier_order_line_ids || [];
    if (!Array.isArray(supplierOrderLineIds)) return;

    supplierOrderLineIds.forEach((item) => {
      const lineData = item.supplier_order_line_id;
      // Exclure la ligne courante
      if (!lineData || lineData.id === currentLineId) return;
      // Dédupliquer par ID
      if (!twinsByLineId.has(lineData.id)) {
        twinsByLineId.set(lineData.id, lineData);
      }
    });
  });

  const twinCount = twinsByLineId.size;
  const hasTwin = twinCount > 0;
  const totalLines = twinCount + 1; // Jumelles + ligne courante

  return {
    hasTwin,
    twinCount,
    totalLines,
  };
};
