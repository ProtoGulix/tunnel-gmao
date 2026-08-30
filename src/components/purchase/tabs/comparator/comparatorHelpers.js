/**
 * Helpers purs pour le comparateur de paniers fournisseurs (n paniers, 2 dans le cas nominal).
 * @module components/purchase/tabs/comparator/comparatorHelpers
 */

export const MAX_COMPARED_ORDERS = 4;

/** Largeur fixe d'une colonne panier — synthèse d'en-tête, cellule fantôme d'ajout
 *  et cellules du corps doivent toutes partager cette même largeur pour rester
 *  alignées, y compris quand une colonne est vide (fantôme au repos). */
export const ORDER_COLUMN_WIDTH = 200;

export function lineKey(line) {
  return line.part_id || line.stock_item_ref || line.stock_item_name || line.id;
}

/**
 * Fusionne les lignes de n paniers par clé d'article commune.
 * Retourne [{ key, linesByOrderId: { [orderId]: line|null } }]
 */
export function mergeLinesAcrossOrders(ordersWithLines) {
  const rowMap = new Map();
  const orderIds = ordersWithLines.map((o) => o.id);

  ordersWithLines.forEach(({ id: orderId, lines }) => {
    (lines || []).forEach((line) => {
      const key = lineKey(line);
      if (!rowMap.has(key)) {
        const linesByOrderId = {};
        orderIds.forEach((oid) => { linesByOrderId[oid] = null; });
        rowMap.set(key, { key, linesByOrderId });
      }
      rowMap.get(key).linesByOrderId[orderId] = line;
    });
  });

  return Array.from(rowMap.values());
}

/** Clés d'articles (part_id/stock_item_ref/nom) présentes dans un jeu de lignes. */
export function articleKeysOf(lines) {
  return new Set((lines || []).map(lineKey));
}

/**
 * Un panier candidat est comparable à la sélection actuelle s'il partage au
 * moins un article avec au moins un panier déjà sélectionné. Sans sélection
 * préalable, tous les paniers sont proposés (rien à comparer encore).
 */
export function isOrderComparable(candidateKeys, selectedKeysList) {
  if (selectedKeysList.length === 0) return true;
  return selectedKeysList.some((keys) => [...candidateKeys].some((k) => keys.has(k)));
}

/**
 * Statut d'une cellule référence x panier : `absent` (la réf n'existe pas dans ce
 * panier), `pending` (ligne présente mais pas de prix — quote_received=false ou
 * prix jamais saisi), `priced` (prix renseigné, comparable). Un prix à 0,00 € saisi
 * est un prix valide (article gratuit), pas un "pending" — distinct de "pas de prix".
 */
export function cellStatus(line, draft) {
  if (!line) return 'absent';
  const hasPrice = draft ? draft.unit_price !== '' && !isNaN(parseFloat(draft.unit_price)) : line.unit_price != null;
  if (!hasPrice && !line.quote_received) return 'pending';
  return 'priced';
}

export function getDraftPrice(drafts, line) {
  if (!line) return NaN;
  const raw = drafts[line.id]?.unit_price;
  if (raw === '' || raw == null) return NaN;
  return parseFloat(raw);
}

export function getDraftDelay(drafts, line) {
  if (!line) return NaN;
  return parseInt(drafts[line.id]?.lead_time_days, 10);
}

/**
 * ID du panier gagnant sur le prix pour une ligne, ou 'tie', ou null si non comparable
 * (moins de 2 offres réellement chiffrées). Un prix à 0 est un prix valide et participe
 * à la comparaison — seule l'absence de valeur (NaN) exclut une offre.
 */
export function rowPriceWinner(row, orderIds, drafts) {
  const prices = orderIds
    .map((oid) => ({ oid, p: getDraftPrice(drafts, row.linesByOrderId[oid]) }))
    .filter(({ p }) => !isNaN(p));
  if (prices.length < 2) return null;
  const minPrice = Math.min(...prices.map((x) => x.p));
  const winners = prices.filter((x) => x.p === minPrice);
  return winners.length > 1 ? 'tie' : winners[0].oid;
}

export function rowDelayWinner(row, orderIds, drafts) {
  const delays = orderIds
    .map((oid) => ({ oid, d: getDraftDelay(drafts, row.linesByOrderId[oid]) }))
    .filter(({ d }) => !isNaN(d) && d >= 0);
  if (delays.length < 2) return null;
  const minDelay = Math.min(...delays.map((x) => x.d));
  const winners = delays.filter((x) => x.d === minDelay);
  return winners.length > 1 ? 'tie' : winners[0].oid;
}

/** Total € des lignes sélectionnées (is_selected) d'un panier, ou null si aucune sélection chiffrée. */
export function computeSelectedTotal(lines, drafts) {
  let sum = 0;
  let any = false;
  (lines || []).forEach((l) => {
    if (!l.is_selected) return;
    const p = getDraftPrice(drafts, l);
    if (!isNaN(p) && l.quantity) { sum += p * l.quantity; any = true; }
  });
  return any ? sum : null;
}

/** Nombre de lignes sélectionnées (is_selected) dans un panier. */
export function countSelectedLines(lines) {
  return (lines || []).filter((l) => l.is_selected).length;
}

/** Délai max (en jours) parmi les lignes sélectionnées d'un panier, ou null si aucune. */
export function computeSelectedMaxDelay(lines, drafts) {
  const delays = (lines || [])
    .filter((l) => l.is_selected)
    .map((l) => getDraftDelay(drafts, l))
    .filter((d) => !isNaN(d) && d >= 0);
  return delays.length > 0 ? Math.max(...delays) : null;
}
