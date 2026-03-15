/**
 * Configuration de la page Planning pour le menu
 * Auto-discovery via import.meta.glob
 */

import { CalendarDays } from 'lucide-react';

export const PAGE_CONFIG = {
  id: 'planning',
  path: '/planning',
  label: 'Planning',
  icon: CalendarDays,
  pageTitle: 'Planning journalier',
  pageSubtitle: 'Actions et présence par technicien',
  section: 'maintenance',
  requiresAuth: true,
  public: false,
  order: 25,
};
