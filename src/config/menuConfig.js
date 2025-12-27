import {
  Home,
  Wrench,
  ShoppingCart,
  ClipboardList,
  Plus,
  Settings,
  Package,
  FileText,
  LayoutList,
} from "lucide-react";

// Imports des composants pages
import PublicHome from "../pages/PublicHome";
import PurchaseRequestForm from "../pages/public/PurchaseRequestForm";
import InterventionRequestForm from "../pages/public/InterventionRequestForm";
import Login from "../pages/Login";
import InterventionsList from "../pages/InterventionsList";
import InterventionDetail from "../pages/InterventionDetail";
import InterventionCreate from "../pages/InterventionCreate";
import MachineList from "../pages/MachineList";
import MachineDetail from "../pages/MachineDetail";
import ActionsPage from "../pages/ActionsPage";
import StockManagement from "../pages/StockManagement";

/**
 * Configuration complète des pages de l'application
 * Définit la navigation, les en-têtes, les icônes, labels, autorisations ET composants
 *
 * Structure de chaque item :
 * - id: Identifiant unique
 * - path: Chemin de la route
 * - component: Composant React à rendre
 * - label: Label affiché dans le menu
 * - icon: Icône Lucide React
 * - pageTitle: Titre de la page (peut être différent du label menu)
 * - pageSubtitle: Sous-titre optionnel pour l'en-tête
 * - public: Visible en mode public ET connecté
 * - publicOnly: Visible uniquement en mode public
 * - requiresAuth: Nécessite une authentification (défaut: true)
 * - showInMenu: Afficher dans le menu latéral (défaut: true)
 */

export const PAGES_CONFIG = [
  // Pages publiques
  {
    id: "home",
    path: "/",
    component: PublicHome,
    label: "Accueil",
    icon: Home,
    pageTitle: "Accueil",
    pageSubtitle: "Bienvenue dans l'application GMAO",
    publicOnly: true,
    requiresAuth: false,
  },
  {
    id: "login",
    path: "/login",
    component: Login,
    label: "Connexion",
    icon: Home,
    pageTitle: "Connexion",
    pageSubtitle: "Connectez-vous à votre compte",
    publicOnly: true,
    requiresAuth: false,
    showInMenu: false,
  },
  {
    id: "intervention-request",
    path: "/public/intervention-request",
    component: InterventionRequestForm,
    label: "Demande d'intervention",
    icon: Wrench,
    pageTitle: "Demande d'intervention",
    pageSubtitle: "Créer une nouvelle demande d'intervention",
    public: true,
    requiresAuth: false,
  },
  {
    id: "purchase-request",
    path: "/public/purchase-request",
    component: PurchaseRequestForm,
    label: "Demande d'achat",
    icon: ShoppingCart,
    pageTitle: "Demande d'achat",
    pageSubtitle: "Créer une nouvelle demande d'achat",
    public: true,
    requiresAuth: false,
  },

  // Pages privées
  {
    id: "interventions",
    path: "/interventions",
    component: InterventionsList,
    label: "Interventions",
    icon: ClipboardList,
    pageTitle: "Gestion des interventions",
    pageSubtitle: "Suivi et gestion de toutes les interventions",
    requiresAuth: true,
  },
  {
    id: "interventions-new",
    path: "/intervention/new",
    component: InterventionCreate,
    label: "Nouvelle intervention",
    icon: Plus,
    pageTitle: "Créer une intervention",
    pageSubtitle: "Ajouter une nouvelle intervention",
    requiresAuth: true,
    showInMenu: false,
  },
  {
    id: "intervention-detail",
    path: "/intervention/:id",
    component: InterventionDetail,
    label: "Détail intervention",
    icon: FileText,
    pageTitle: "Détail de l'intervention",
    pageSubtitle: null, // Sera défini dynamiquement
    requiresAuth: true,
    showInMenu: false, // Ne pas afficher dans le menu
  },
  {
    id: "actions",
    path: "/actions",
    component: ActionsPage,
    label: "Actions",
    icon: LayoutList,
    pageTitle: "Gestion des actions",
    pageSubtitle: "Suivi des actions et analyse de charge",
    timeFilter: {
      enabled: true,
      mode: "popover",
      component: "daterange",
      triggerLabel: "Période d'analyse",
    },
    requiresAuth: true,
  },
  {
    id: "machines",
    path: "/machines",
    component: MachineList,
    label: "Machines",
    icon: Settings,
    pageTitle: "Parc machines",
    pageSubtitle: "Gestion et suivi des machines",
    requiresAuth: true,
  },
  {
    id: "machine-detail",
    path: "/machines/:id",
    component: MachineDetail,
    label: "Détail machine",
    icon: Settings,
    pageTitle: "Détail de la machine",
    pageSubtitle: null, // Sera défini dynamiquement
    requiresAuth: true,
    showInMenu: false,
  },
  {
    id: "stock",
    path: "/stock",
    component: StockManagement,
    label: "Stock",
    icon: Package,
    pageTitle: "Gestion du stock",
    pageSubtitle: "Articles en stock et demandes d'achat",
    requiresAuth: true,
  },
];

// Rétrocompatibilité : export de MENU_CONFIG
export const MENU_CONFIG = {
  public: PAGES_CONFIG.filter((p) => p.public || p.publicOnly),
  private: PAGES_CONFIG.filter((p) => p.requiresAuth && !p.publicOnly),
};

/**
 * Retourne les items du menu selon l'état d'authentification
 * @param {boolean} isAuthenticated - Si l'utilisateur est connecté
 * @returns {Array} Liste des items à afficher
 */
export function getMenuItems(isAuthenticated) {
  return PAGES_CONFIG.filter((item) => {
    // Ne pas afficher les items masqués du menu
    if (item.showInMenu === false) return false;

    if (isAuthenticated) {
      // Mode connecté : tout sauf publicOnly
      return !item.publicOnly;
    } else {
      // Mode public : uniquement les pages publiques
      return item.public || item.publicOnly;
    }
  });
}

/**
 * Retourne les sections groupées pour l'affichage
 * @param {boolean} isAuthenticated - Si l'utilisateur est connecté
 * @returns {Object} Sections avec leurs items
 */
export function getMenuSections(isAuthenticated) {
  const menuItems = getMenuItems(isAuthenticated);

  if (isAuthenticated) {
    return {
      main: menuItems.filter((item) => item.requiresAuth && !item.public),
      public: menuItems.filter((item) => item.public && !item.publicOnly),
    };
  } else {
    return {
      public: menuItems,
    };
  }
}

/**
 * Trouve une configuration de page par son chemin
 * @param {string} path - Chemin de la page (peut contenir des paramètres comme :id)
 * @returns {Object|null} Configuration de la page ou null si non trouvée
 */
export function getPageConfig(path) {
  // Recherche exacte d'abord
  let page = PAGES_CONFIG.find((p) => p.path === path);

  // Si pas trouvé, chercher avec correspondance de pattern (pour les routes dynamiques)
  if (!page) {
    page = PAGES_CONFIG.find((p) => {
      const pattern = p.path.replace(/:[^/]+/g, "[^/]+");
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(path);
    });
  }

  return page || null;
}

/**
 * Trouve une configuration de page par son ID
 * @param {string} id - ID de la page
 * @returns {Object|null} Configuration de la page ou null si non trouvée
 */
export function getPageConfigById(id) {
  return PAGES_CONFIG.find((p) => p.id === id) || null;
}

/**
 * Vérifie si l'utilisateur a accès à une page
 * @param {Object} pageConfig - Configuration de la page
 * @param {boolean} isAuthenticated - Si l'utilisateur est connecté
 * @returns {boolean} True si l'utilisateur a accès
 */
export function canAccessPage(pageConfig, isAuthenticated) {
  if (!pageConfig) return false;

  // Pages publiques accessibles sans authentification
  if (pageConfig.public || pageConfig.publicOnly) {
    return true;
  }

  // Pages privées nécessitent authentification
  if (pageConfig.requiresAuth) {
    return isAuthenticated;
  }

  return true;
}
