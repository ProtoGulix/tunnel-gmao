/**
 * Configuration de la page Qualité des Données pour le menu
 * Auto-discovery via import.meta.glob
 */

import { Database } from 'lucide-react';

export const PAGE_CONFIG = {
  id: 'quality-data',
  path: '/quality-data',
  label: 'Qualité Données',
  icon: Database,
  pageTitle: 'Qualité des données',
  pageSubtitle: 'Contrôle de complétude et cohérence',
  section: 'production',
  requiresAuth: true,
  public: false,
};
