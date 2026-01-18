/**
 * @fileoverview Constants et helpers pour la gestion des paniers fournisseurs
 *
 * Définit les seuils, les statuts, et les fonctions utilitaires pour
 * l'affichage et le traitement des paniers de commandes.
 *
 * @module components/purchase/orders/supplierOrdersConfig
 */

// ===== CONSTANTES TEMPORELLES =====
/** Nombre de millisecondes dans un jour */
export const DAY_IN_MS = 1000 * 60 * 60 * 24;

/** Nombre de jours avant que panier OPEN soit considéré comme stale */
export const STALE_OPEN_DAYS = 5;

/** Nombre de jours avant que panier SENT soit considéré comme stale */
export const STALE_SENT_DAYS = 3;

// ===== MAPPING STATUTS =====
/** Mapping statut commande → statut demande d'achat */
export const STATUS_MAPPING = {
  OPEN: 'in_progress',
  SENT: 'ordered',
  ACK: 'ordered',
  RECEIVED: 'ordered',
  CLOSED: 'received',
  CANCELLED: 'cancelled',
};

// ===== HELPERS =====
/**
 * Calcule l'âge en jours d'une date
 *
 * @param {string|Date} date - Date ISO ou objet Date
 * @returns {number|null} Nombre de jours écoulés, ou null si date invalide
 */
export const getAgeInDays = (date) => {
  if (!date) return null;
  const diff = Date.now() - new Date(date).getTime();
  return Math.max(0, Math.floor(diff / DAY_IN_MS));
};

/**
 * Accesseurs DTO-friendly supportant snake_case et camelCase
 */
export const getOrderNumber = (order) => order?.orderNumber ?? order?.order_number;
export const getCreatedAt = (order) => order?.createdAt ?? order?.created_at;
export const getSupplierObj = (order) => order?.supplier ?? order?.supplier_id;
export const getLineCount = (order) => Number(order?.lineCount ?? order?.line_count ?? 0);

/**
 * Détermine la couleur d'affichage selon l'âge du panier
 *
 * Seuils:
 * - >14j = rouge, >7j = orange, sinon gris
 *
 * @param {Object} order - Commande
 * @returns {string} Couleur Radix UI (gray, orange, red)
 */
export const getAgeColor = (order) => {
  const ageDays = getAgeInDays(getCreatedAt(order));
  if (ageDays == null) return 'gray';
  // Simplified, status-agnostic signal:
  // >14j = red, >7j = orange, else gray
  if (ageDays > 14) return 'red';
  if (ageDays > 7) return 'orange';
  return 'gray';
};

/**
 * Vérifie si une commande est bloquée (urgente)
 *
 * @param {string} status - Statut de la commande
 * @param {number|null} ageDays - Âge en jours
 * @returns {boolean} true si commande est bloquée
 */
export const isBlockingOrder = (status, ageDays) => {
  if (ageDays == null) return false;
  return (
    (status === 'OPEN' && ageDays > STALE_OPEN_DAYS) ||
    (status === 'SENT' && ageDays > STALE_SENT_DAYS)
  );
};
