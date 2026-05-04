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

/**
 * LEGACY_PAGES - Réference historique (DÉPRÉCIÉ)
 * Ces pages ne sont plus utilisées pour la génération du menu.
 * Toutes les pages doivent maintenant avoir un fichier [PageName].config.js
 * avec export const PAGE_CONFIG.
 *
 * À supprimer progressivement quand les pages sont entièrement migrées.
 */
const LEGACY_PAGES = [
  {
    id: 'intervention-request',
    path: '/public/intervention-request',
    label: "Demande d'intervention",
    icon: Wrench,
    pageTitle: "Demande d'intervention",
    pageSubtitle: "Créer une nouvelle demande d'intervention",
    public: true,
    section: 'public',
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
    section: 'public',
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
    section: 'maintenance',
    order: 5,
    requiresAuth: true,
  },
  {
    id: 'interventions-new',
    path: '/intervention/new',
    label: 'Nouvelle intervention',
    icon: Plus,
    pageTitle: 'Créer une intervention',
    pageSubtitle: 'Ajouter une nouvelle intervention',
    section: 'maintenance',
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
    section: 'maintenance',
    requiresAuth: true,
    showInMenu: false,
  },
  {
    id: 'equipements-legacy',
    path: '/equipements',
    label: 'Équipements',
    icon: Settings,
    pageTitle: 'Parc équipements',
    pageSubtitle: 'Gestion et suivi de tous les équipements',
    section: 'maintenance',
    order: 20,
    requiresAuth: true,
  },
  {
    id: 'equipement-detail',
    path: '/equipements/:id',
    label: 'Détail équipement',
    icon: Settings,
    pageTitle: "Détail de l'équipement",
    pageSubtitle: null,
    section: 'maintenance',
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
    section: 'maintenance',
    order: 40,
    requiresAuth: true,
  },
  {
    id: 'parts',
    path: '/parts',
    label: 'Pièces',
    icon: Package,
    pageTitle: 'Référentiel des pièces',
    pageSubtitle: 'Pièces, fabricants et fournisseurs',
    section: 'stock',
    order: 10,
    requiresAuth: true,
  },
  {
    id: 'procurement',
    path: '/procurement',
    label: 'Approvisionnements',
    icon: ShoppingCart,
    pageTitle: 'Approvisionnements',
    pageSubtitle: "Demandes d'achat et paniers fournisseurs",
    section: 'stock',
    order: 30,
    requiresAuth: true,
  },
  {
    id: 'technical-workload',
    path: '/charge-technique',
    label: 'Charge technique',
    icon: TrendingUp,
    pageTitle: 'Charge technique',
    pageSubtitle: 'Analyse du temps de maintenance',
    section: 'production',
    order: 10,
    requiresAuth: true,
    disabled: true,
  },
  {
    id: 'anomalies-saisie',
    path: '/anomalies-saisie',
    label: 'Anomalies de saisie',
    icon: AlertTriangle,
    pageTitle: 'Anomalies de saisie',
    pageSubtitle: 'Contrôle qualité des actions',
    section: 'production',
    order: 20,
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
    section: 'production',
    order: 30,
    requiresAuth: true,
  },
];

/**
 * Configuration complète des pages - générée uniquement via auto-discovery
 * Les pages de LEGACY_PAGES ne sont plus utilisées
 */
export const PAGES_CONFIG = discoveredPages;

// Section mapping - groupement visuel dans le menu
const SECTION_LABELS = {
  main: 'Navigation',
  maintenance: 'Maintenance',
  stock: 'Stock',
  production: 'Production',
  admin: 'Administration',
  public: 'Public',
};

const SECTION_ORDER = {
  main: 0,
  maintenance: 1,
  stock: 2,
  production: 3,
  admin: 4,
  public: 5,
};

export { SECTION_LABELS, SECTION_ORDER };

export const MENU_CONFIG = {
  public: PAGES_CONFIG.filter((p) => p.public || p.publicOnly),
  private: PAGES_CONFIG.filter((p) => p.requiresAuth && !p.publicOnly),
};

/** Retourne les items du menu selon l'état d'authentification et le rôle */
export function getMenuItems(isAuthenticated, userRole = null) {
  const normalizedRole = userRole?.toUpperCase() ?? null;
  return PAGES_CONFIG.filter((item) => {
    if (item.showInMenu === false || item.disabled === true) return false;
    if (isAuthenticated) {
      if (item.publicOnly) return false;
      // Filtrer les items qui requièrent un rôle spécifique
      if (item.requiredRoles && !item.requiredRoles.map((r) => r.toUpperCase()).includes(normalizedRole)) return false;
      return true;
    }
    return item.public || item.publicOnly;
  });
}

/** Retourne les sections groupées et triées pour l'affichage */
export function getMenuSections(isAuthenticated, userRole = null) {
  const menuItems = getMenuItems(isAuthenticated, userRole);

  if (isAuthenticated) {
    // Grouper par section
    const sections = {};

    menuItems
      .filter((item) => item.requiresAuth && !item.public)
      .forEach((item) => {
        const section = item.section || 'maintenance';
        if (!sections[section]) {
          sections[section] = [];
        }
        sections[section].push(item);
      });

    // Trier chaque section par order
    Object.keys(sections).forEach((section) => {
      sections[section].sort((a, b) => {
        const orderA = a.order ?? 999;
        const orderB = b.order ?? 999;
        return orderA - orderB;
      });
    });

    // Retourner groupé avec label et ordre de section
    const result = {};
    Object.keys(sections)
      .sort((a, b) => (SECTION_ORDER[a] ?? 999) - (SECTION_ORDER[b] ?? 999))
      .forEach((section) => {
        result[section] = sections[section];
      });

    return {
      ...result,
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
