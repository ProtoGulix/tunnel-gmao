import { Settings } from 'lucide-react';

export const PAGE_CONFIG = {
  id: 'admin',
  path: '/admin',
  label: 'Administration',
  icon: Settings,
  pageTitle: 'Administration',
  pageSubtitle: 'Utilisateurs, rôles, référentiel et sécurité',
  section: 'admin',
  requiresAuth: true,
  showInMenu: true,
  requiredRoles: ['RESP', 'ADMIN'],
  order: 0,
};
