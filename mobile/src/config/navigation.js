// ─── Structure de navigation TUNNEL GMAO ────────────────────────────────────
// Icônes : lucide-react (web) — même noms que lucide-react-native
// 4 sections organisées par domaine métier

export const NAV_SECTIONS = [
  {
    label: 'Principal',
    order: 0,
    items: [
      { label: 'Accueil',       route: '/',                      icon: 'Home' },
    ],
  },
  {
    label: 'Maintenance',
    order: 1,
    items: [
      { label: 'Interventions', route: '/interventions',          icon: 'Wrench' },
      { label: 'Demandes',      route: '/intervention-requests',  icon: 'ClipboardList' },
      { label: 'Équipements',   route: '/equipements',            icon: 'Factory' },
    ],
  },
  {
    label: 'Stock',
    order: 2,
    items: [
      { label: 'Stock',             route: '/stock',     icon: 'Package' },
      { label: 'Fournisseurs',      route: '/suppliers', icon: 'Truck' },
      { label: 'Demandes d\'achat', route: '/achats',    icon: 'ShoppingCart' },
    ],
  },
  {
    label: 'Production',
    order: 3,
    items: [
      { label: 'État du service', route: '/service-status', icon: 'Activity' },
      { label: 'Qualité Données', route: '/quality-data',   icon: 'Database' },
    ],
  },
]

// Liste plate pour la BottomNav (les routes les plus fréquentes)
export const BOTTOM_NAV_ITEMS = [
  { label: 'Accueil',        route: '/',                     icon: 'Home' },
  { label: 'Interventions',  route: '/interventions',         icon: 'Wrench' },
  { label: 'Demandes',       route: '/intervention-requests', icon: 'ClipboardList' },
  { label: 'Stock',          route: '/stock',                 icon: 'Package' },
  { label: 'Achats',         route: '/achats',                icon: 'ShoppingCart' },
]

// Icônes additionnelles à importer pour les composants de statut
export const STATUS_ICONS = [
  'Clock', 'Timer', 'Check', 'X', 'Pause', 'CircleDot', 'Circle', 'HelpCircle',
]

export const PRIORITY_ICONS = [
  'AlertCircle', 'AlertTriangle', 'ArrowRight', 'ArrowDown',
]

export const MISC_ICONS = [
  'Zap', 'Diamond', 'Star', 'Repeat', 'Flame', 'LogIn',
]
