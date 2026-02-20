/**
 * @fileoverview Constants et helpers pour la gestion des paniers fournisseurs
 *
 * Définit les seuils, les statuts, et les fonctions utilitaires pour
 * l'affichage et le traitement des paniers de commandes.
 *
 * @module components/purchase/orders/supplierOrdersConfig
 */

// ===== CONSTANTES TEMPORELLES =====
// Les décisions (âge, couleur, blocage) sont fournies par le backend.

// ===== MAPPING STATUTS =====
/** Mapping statut commande → label UI (SUPPLIER_ORDER_LIFECYCLE.md) */
// - OPEN      → En mutualisation
// - SENT      → En chiffrage
// - ACK       → Commandé
// - RECEIVED  → Commandé
// - CLOSED    → Clôturé
// - CANCELLED → Annulé
export const STATUS_MAPPING = {
  OPEN: 'En mutualisation',
  SENT: 'En chiffrage',
  ACK: 'Commandé',
  RECEIVED: 'Commandé',
  CLOSED: 'Clôturé',
  CANCELLED: 'Annulé',
};

// ===== HELPERS =====
/**
 * Calcule l'âge en jours d'une date
 *
 * @param {string|Date} date - Date ISO ou objet Date
 * @returns {number|null} Nombre de jours écoulés, ou null si date invalide
 */
/**
 * Accesseurs DTO-friendly pour le format normalisé (camelCase)
 */
export const getOrderNumber = (order) => order?.orderNumber ?? null;
export const getSupplierObj = (order) => order?.supplier ?? null;
export const getLineCount = (order) => Number(order?.lineCount ?? 0);

/**
 * Décisions backend (âge, couleur, blocage)
 */
export const getOrderAgeDays = (order) => {
  const backendAge = order?.ageDays;
  if (backendAge === undefined || backendAge === null) return null;
  const normalized = Number(backendAge);
  return Number.isFinite(normalized) ? normalized : null;
};

/**
 * Détermine la couleur d'affichage selon l'âge du panier
 *
 * Seuils:
 * - >14j = rouge, >7j = orange, sinon gris
 *
 * @param {Object} order - Commande
 * @returns {string} Couleur Radix UI (gray, orange, red)
 */
export const getAgeColor = (order) => order?.ageColor ?? 'gray';
export const getOrderIsBlocking = (order) => Boolean(order?.isBlocking);
