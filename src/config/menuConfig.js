import {
  Wrench,
  ShoppingCart,
  ClipboardList,
  Plus,
  Settings,
  Package,
  FileText,
  TrendingUp,
  AlertTriangle,
  Database,
} from 'lucide-react';

/**
 * Configuration des pages (V3 : Auto-discovery via *.config.js)
 * HomePage ✅ | Login ✅ | ServiceStatus ✅
 * En migration : interventions, équipements, stock, etc.
 */

// Auto-discovery : importer toutes les configs de pages
const pageConfigModules = import.meta.glob('@/pages/**/*.config.js', { eager: true });
const discoveredPages = Object.values(pageConfigModules)
  .map((module) => module.PAGE_CONFIG)
  .filter(Boolean);

const LEGACY_PAGES = [
  {
    id: 'intervention-request',
    path: '/public/intervention-request',
    label: "Demande d'intervention",
    icon: Wrench,
    pageTitle: "Demande d'intervention",
    pageSubtitle: "Créer une nouvelle demande d'intervention",
    public: true,
    requiresAuth: false,
  },
  {
    id: 'purchase-request',
    path: '/public/purchase-request',
    label: "Demande d'achat",
    icon: ShoppingCart,
    pageTitle: "Demande d'achat",
    pageSubtitle: "Créer une nouvelle demande d'achat",
    public: true,
    requiresAuth: false,
  },

  // Pages privées (à migrer)
  {
    id: 'technician-home',
    path: '/technician',
    label: 'Accueil Atelier',
    icon: Wrench,
    pageTitle: 'Interventions en attente',
    pageSubtitle: 'PC commun atelier',
    requiresAuth: true,
  },
  {
    id: 'interventions',
    path: '/interventions',
    label: 'Interventions',
    icon: ClipboardList,
    pageTitle: 'Gestion des interventions',
    pageSubtitle: 'Suivi et gestion de toutes les interventions',
    requiresAuth: true,
  },
  {
    id: 'interventions-new',
    path: '/intervention/new',
    label: 'Nouvelle intervention',
    icon: Plus,
    pageTitle: 'Créer une intervention',
    pageSubtitle: 'Ajouter une nouvelle intervention',
    requiresAuth: true,
    showInMenu: false,
  },
  {
    id: 'intervention-detail',
    path: '/intervention/:id',
    label: 'Détail intervention',
    icon: FileText,
    pageTitle: "Détail de l'intervention",
    pageSubtitle: null,
    requiresAuth: true,
    showInMenu: false,
  },
  {
    id: 'equipements',
    path: '/equipements',
    label: 'Équipements',
    icon: Settings,
    pageTitle: 'Parc équipements',
    pageSubtitle: 'Gestion et suivi de tous les équipements',
    requiresAuth: true,
  },
  {
    id: 'equipement-detail',
    path: '/equipements/:id',
    label: 'Détail équipement',
    icon: Settings,
    pageTitle: "Détail de l'équipement",
    pageSubtitle: null, // Sera défini dynamiquement
    requiresAuth: true,
    showInMenu: false,
  },
  {
    id: 'preventive-management',
    path: '/preventive-management',
    label: 'Préventif',
    icon: ClipboardList,
    pageTitle: 'Gestion du Préventif',
    pageSubtitle: 'Maintenance préventive : préconisations, règles et configuration',
    requiresAuth: true,
  },
  {
    id: 'parts',
    path: '/parts',
    label: 'Pièces',
    icon: Package,
    pageTitle: 'Référentiel des pièces',
    pageSubtitle: 'Pièces, fabricants et fournisseurs',
    requiresAuth: true,
  },
  {
    id: 'procurement',
    path: '/procurement',
    label: 'Approvisionnements',
    icon: ShoppingCart,
    pageTitle: 'Approvisionnements',
    pageSubtitle: "Demandes d'achat et paniers fournisseurs",
    requiresAuth: true,
  },
  {
    id: 'technical-workload',
    path: '/charge-technique',
    label: 'Charge technique',
    icon: TrendingUp,
    pageTitle: 'Charge technique',
    pageSubtitle: 'Analyse du temps de maintenance',
    requiresAuth: true,
    disabled: true, // BETA: endpoint /stats/charge-technique en cours de refactoring
  },
  {
    id: 'anomalies-saisie',
    path: '/anomalies-saisie',
    label: 'Anomalies de saisie',
    icon: AlertTriangle,
    pageTitle: 'Anomalies de saisie',
    pageSubtitle: 'Contrôle qualité des actions',
    timeFilter: {
      enabled: true,
      mode: 'popover',
      component: 'daterange',
      triggerLabel: "Période d'analyse",
    },
    requiresAuth: true,
    disabled: true,
  },
  {
    id: 'qualite-donnees',
    path: '/qualite-donnees',
    label: 'Qualité des données',
    icon: Database,
    pageTitle: 'Qualité des données',
    pageSubtitle: 'Contrôle de complétude et cohérence',
    requiresAuth: true,
  },
];

export const PAGES_CONFIG = [...discoveredPages, ...LEGACY_PAGES];

export const MENU_CONFIG = {
  public: PAGES_CONFIG.filter((p) => p.public || p.publicOnly),
  private: PAGES_CONFIG.filter((p) => p.requiresAuth && !p.publicOnly),
};

/** Retourne les items du menu selon l'état d'authentification */
export function getMenuItems(isAuthenticated) {
  return PAGES_CONFIG.filter((item) => {
    if (item.showInMenu === false || item.disabled === true) return false;
    if (isAuthenticated) return !item.publicOnly;
    return item.public || item.publicOnly;
  });
}
/** Retourne les sections groupées pour l'affichage */
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

/** Trouve une configuration de page par son chemin */
export function getPageConfig(path) {
  let page = PAGES_CONFIG.find((p) => p.path === path);
  if (!page) {
    page = PAGES_CONFIG.find((p) => {
      const pattern = p.path.replace(/:[^/]+/g, '[^/]+');
      return new RegExp(`^${pattern}$`).test(path);
    });
  }
  return page || null;
}
/** Trouve une config de page par ID */
export function getPageConfigById(id) {
  return PAGES_CONFIG.find((p) => p.id === id) || null;
}
/** Vérifie si l'utilisateur a accès à une page */
export function canAccessPage(pageConfig, isAuthenticated) {
  if (!pageConfig) return false;
  if (pageConfig.public || pageConfig.publicOnly) return true;
  return pageConfig.requiresAuth ? isAuthenticated : true;
}
