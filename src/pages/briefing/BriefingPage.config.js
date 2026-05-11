import { ClipboardList } from 'lucide-react';

export const PAGE_CONFIG = {
  id: 'briefing',
  path: '/briefing',
  label: 'Briefing',
  icon: ClipboardList,
  pageTitle: 'Briefing',
  pageSubtitle: 'Situations actives et décisions en attente',
  section: 'maintenance',
  requiresAuth: true,
  public: false,
  order: 15,
};
