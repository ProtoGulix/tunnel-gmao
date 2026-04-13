/**
 * Configuration de la page Demandes d'intervention pour le menu
 * Auto-discovery via import.meta.glob
 */

import { ClipboardList } from 'lucide-react';

export const PAGE_CONFIG = {
  id: 'intervention-requests',
  path: '/intervention-requests',
  label: 'Demandes',
  icon: ClipboardList,
  pageTitle: "Demandes d'intervention",
  pageSubtitle: "Suivi des demandes avant création d'intervention",
  section: 'maintenance',
  requiresAuth: true,
  public: false,
  order: 15,
  showInMenu: false,
};
