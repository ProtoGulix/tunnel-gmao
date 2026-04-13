/**
 * @fileoverview Configuration page Préventif — auto-discovery menu
 * @module pages/preventive/PreventivePage.config
 */

import { ClipboardCheck } from 'lucide-react';

export const PAGE_CONFIG = {
  id: 'preventive',
  path: '/preventive',
  label: 'Préventif',
  icon: ClipboardCheck,
  pageTitle: 'Préventif',
  pageSubtitle: 'Plans et occurrences de maintenance préventive',
  section: 'maintenance',
  requiresAuth: true,
  public: false,
  order: 40,
};
