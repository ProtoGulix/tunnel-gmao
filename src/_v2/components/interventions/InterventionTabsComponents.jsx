/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📑 InterventionTabsComponents.jsx - Configuration onglets intervention
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Configuration centralisée des onglets pour page InterventionDetail:
 * - TABS_CONFIG: Metadata 4 onglets (actions, commandes pièces, fiche PDF, historique)
 * 
 * ✅ Implémenté :
 * - TABS_CONFIG avec metadata complète (id, label, icon, badge function, badgeColor)
 * - Badge dynamique calculé via fonction badge(data)
 * - Integration Lucide React icons
 * 
 * 📋 TODO : Améliorations futures
 * - [✓] ⚠️ URGENT: Vérifier si TabTrigger et TabContent encore utilisés ou à supprimer → SUPPRIMÉS
 * - [ ] Mode tab stats avancé : graphiques temps par technicien
 * - [ ] Tab notifications : badge rouge si nouvelles actions non lues
 * - [ ] Personnalisation ordre tabs : drag & drop configuration
 * - [ ] Tab favoris : mémoriser dernier tab consulté par utilisateur
 * - [ ] Lazy loading : charger contenu tab uniquement si actif
 * - [ ] Keyboard shortcuts : Ctrl+1/2/3/4 pour navigation rapide
 * - [ ] Export configuration : sauvegarder setup tabs personnalisé
 * - [ ] Thème tabs : couleurs personnalisées par type intervention
 * 
 * @module components/interventions/InterventionTabsComponents
 * @requires lucide-react
 */

import { Activity, FileDown, History, Package } from "lucide-react";

/**
 * Configuration des 4 onglets intervention avec metadata complète
 * Chaque tab contient : id, label, icon (Lucide), badge function, badgeColor
 * 
 * @constant
 * @type {Array<Object>}
 * @property {string} id - Identifiant unique tab
 * @property {string} label - Libellé affiché
 * @property {React.Component} icon - Composant icon Lucide React
 * @property {Function} [badge] - Fonction calculant valeur badge dynamique
 * @property {string} [badgeColor] - Couleur badge Radix UI
 * 
 * @example
 * TABS_CONFIG.map(tab => (
 *   <Tabs.Trigger key={tab.id} value={tab.id}>
 *     <tab.icon size={16} />
 *     <Text>{tab.label}</Text>
 *   </Tabs.Trigger>
 * ))
 */
export const TABS_CONFIG = [
  {
    id: "actions",
    label: "Actions",
    icon: Activity,
    badge: (interv) => interv.action?.length || 0,
    badgeColor: "blue"
  },
  {
    id: "summary",
    label: "Commandes pièces",
    icon: Package,
    badge: (data) => data?.purchaseRequestsCount || 0,
    badgeColor: "orange"
  },
  {
    id: "fiche",
    label: "Fiche intervention",
    icon: FileDown,
    badgeColor: null
  },
  {
    id: "details",
    label: "Historique",
    icon: History,
    badge: (data) => data?.timeline?.length || 0,
    badgeColor: "amber"
  }
];
