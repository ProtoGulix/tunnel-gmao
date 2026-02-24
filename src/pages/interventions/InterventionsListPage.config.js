/**
 * Configuration de la page Interventions List pour le menu
 * Auto-discovery via import.meta.glob
 */

import { Wrench } from 'lucide-react';

export const PAGE_CONFIG = {
  id: 'interventions',
  path: '/interventions',
  label: 'Interventions',
  icon: Wrench,
  pageTitle: 'Interventions',
  pageSubtitle: 'Gestion des interventions de maintenance',
  section: 'maintenance',
  requiresAuth: true,
  public: false,
  order: 10,
};
