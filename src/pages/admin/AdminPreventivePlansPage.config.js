/**
 * @fileoverview Configuration page Plans Préventifs — auto-discovery menu
 * @module pages/admin/AdminPreventivePlansPage.config
 */

import { ClipboardCheck } from 'lucide-react';

export const PAGE_CONFIG = {
  id: 'admin-preventive-plans',
  path: '/admin/preventive-plans',
  label: 'Plans Préventifs',
  icon: ClipboardCheck,
  pageTitle: 'Plans Préventifs',
  pageSubtitle: 'Configuration de la maintenance préventive',
  section: 'admin',
  requiresAuth: true,
  public: false,
  order: 10,
  showInMenu: false,
};
