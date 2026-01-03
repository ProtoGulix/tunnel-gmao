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
export const getTotalAmount = (order) => order?.totalAmount ?? order?.total_amount;
export const getLineCount = (order) => Number(order?.lineCount ?? order?.line_count ?? 0);

/**
 * Détermine la couleur d'affichage selon l'âge et le statut
 *
 * Hiérarchie visuelle:
 * - OPEN: gris (<1j), jaune (1-2j), amber (3-4j), rouge (5j+)
 * - SENT: gris (<3j), amber (3j+)
 * - Autres: gris
 *
 * @param {Object} order - Commande
 * @returns {string} Couleur Radix UI (gray, yellow, amber, red)
 */
export const getAgeColor = (order) => {
  const ageDays = getAgeInDays(getCreatedAt(order));
  if (ageDays == null) return 'gray';

  if (order.status === 'OPEN') {
    if (ageDays >= STALE_OPEN_DAYS) return 'red';
    if (ageDays >= 3) return 'amber';
    if (ageDays >= 1) return 'yellow';
    return 'gray';
  }

  if (order.status === 'SENT') {
    if (ageDays >= STALE_SENT_DAYS) return 'amber';
    return 'gray';
  }

  return 'gray';
};

/**
 * Vérifie si une commande doit afficher un montant
 *
 * @param {string} status - Statut de la commande
 * @returns {boolean} true si montant doit être affiché
 */
export const canShowAmount = (status) => ['ACK', 'RECEIVED', 'CLOSED'].includes(status);

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

/**
 * Texte de raison pour commande bloquée
 *
 * @param {string} status - Statut de la commande
 * @returns {string} Raison du blocage
 */
export const getBlockingReason = (status) => {
  return status === 'OPEN' ? 'Panier ouvert depuis plusieurs jours' : 'Envoyé sans réponse';
};
