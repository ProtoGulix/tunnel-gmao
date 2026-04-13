/**
 * @fileoverview Configuration page Occurrences Préventives — auto-discovery menu
 * @module pages/admin/AdminPreventiveOccurrencesPage.config
 */

import { CalendarClock } from 'lucide-react';

export const PAGE_CONFIG = {
  id: 'admin-preventive-occurrences',
  path: '/admin/preventive-occurrences',
  label: 'Occurrences Préventives',
  icon: CalendarClock,
  pageTitle: 'Occurrences Préventives',
  pageSubtitle: 'Génération et suivi des occurrences de maintenance',
  section: 'admin',
  requiresAuth: true,
  public: false,
  order: 20,
  showInMenu: false,
};
