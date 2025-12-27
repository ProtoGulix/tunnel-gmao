/**
 * Constantes et configurations pour StockManagement
 * Centralise tous les paramètres et configurations
 */

// Tab definitions
export const STOCK_MANAGEMENT_TABS = {
  REQUESTS: "requests",
  ORDERS: "orders",
  STOCK: "stock",
  SUPPLIERS: "suppliers",
  SUPPLIER_REFS: "supplier-refs",
};

// Supplier order statuses
export const SUPPLIER_ORDER_STATUSES = [
  { value: "all", label: "Tous" },
  { value: "OPEN", label: "Ouverts" },
  { value: "SENT", label: "Envoyés" },
  { value: "ACK", label: "Accusés" },
  { value: "RECEIVED", label: "Reçus" },
  { value: "CLOSED", label: "Clôturés" },
];

// Purchase request urgency levels
export const URGENCY_LEVELS = [
  { value: "all", label: "Toutes" },
  { value: "high", label: "Urgent" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Faible" },
];

// Default sort config
export const DEFAULT_SORT_CONFIG = {
  key: "name",
  direction: "asc",
};

// Default supplier ref form data
export const DEFAULT_SUPPLIER_REF_FORM = {
  supplier_id: "",
  supplier_ref: "",
  unit_price: "",
  delivery_time_days: "7",
  is_preferred: false,
  // Optional manufacturer fields (progressive enhancement)
  manufacturer_name: "",
  manufacturer_ref: "",
  manufacturer_designation: "",
};

// Default dispatch result
export const DEFAULT_DISPATCH_RESULT = null;

// Auto-refresh intervals (in seconds)
export const AUTO_REFRESH_INTERVALS = {
  silent: 5, // Auto-refresh silencieux
  withSpinner: 30, // Manual refresh avec spinner
};

// Error messages
export const ERROR_MESSAGES = {
  STOCK_LOAD: "Impossible de charger le stock",
  REQUESTS_LOAD: "Impossible de charger les demandes d'achat",
  SUPPLIERS_LOAD: "Impossible de charger les fournisseurs",
  ORDERS_LOAD: "Impossible de charger les paniers",
  ADD_STOCK_ITEM: "Erreur lors de l'ajout de l'article",
  UPDATE_STOCK_ITEM: "Erreur lors de la modification de l'article",
  LINK_ITEM: "Erreur lors de la liaison de l'article",
  ADD_SUPPLIER_REF: "Erreur lors de l'ajout de la référence",
  UPDATE_SUPPLIER_REF: "Erreur lors de la mise à jour de la référence",
  DELETE_SUPPLIER_REF: "Erreur lors de la suppression de la référence",
  STATUS_CHANGE: "Erreur lors du changement de statut",
  DISPATCH: "Erreur lors du dispatch",
  NO_READY_REQUESTS: "Aucune demande prête pour dispatch",
};

// Success messages
export const SUCCESS_MESSAGES = {
  STOCK_ITEM_ADDED: "Article ajouté avec succès",
  STOCK_ITEM_UPDATED: "Article modifié avec succès",
  ITEM_LINKED: "Article lié avec succès",
  SUPPLIER_REF_ADDED: "Référence fournisseur ajoutée",
  SUPPLIER_REF_UPDATED: "Référence mise à jour",
  SUPPLIER_REF_DELETED: "Référence supprimée",
  DISPATCH_STARTED: "Dispatch terminé",
};

// Table column configuration
export const STOCK_TABLE_COLUMNS = [
  { key: "ref", label: "Référence", width: "120px" },
  { key: "name", label: "Nom", width: "200px" },
  { key: "family", label: "Famille", width: "100px" },
  { key: "quantity", label: "Stock", width: "80px" },
  { key: "specs", label: "Spécs", width: "80px" },
  { key: "suppliers", label: "Références", width: "100px" },
  { key: "actions", label: "", width: "80px" },
];

// Stat cards configuration
export const STAT_CARDS_CONFIG = [
  { key: "total", label: "Articles" },
  { key: "total", label: "Demandes" },
  { key: "ready", label: "Prêtes" },
  { key: "toQualify", label: "À qualifier" },
  { key: "openOrders", label: "Paniers ouverts" },
];
