/**
 * Configuration de la page État du Service pour le menu
 * @type {import('@/config/menuConfig').PageConfig}
 */

import { Activity } from 'lucide-react';

export const PAGE_CONFIG = {
  id: 'service-status',
  path: '/service-status',
  label: 'État du service',
  icon: Activity,
  pageTitle: 'État du service',
  pageSubtitle: 'Charge, fragmentation, capacité réelle',
  section: 'production',
  requiresAuth: true,
  public: false,
};
