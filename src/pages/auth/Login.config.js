import { LogIn } from 'lucide-react';

/**
 * Configuration de la page de connexion
 * @module pages/auth/Login.config
 */

export const PAGE_CONFIG = {
  id: 'login',
  path: '/login',
  label: 'Connexion',
  icon: LogIn,
  pageTitle: 'Connexion',
  pageSubtitle: 'Connectez-vous à votre compte',
  publicOnly: true,
  requiresAuth: false,
  showInMenu: false,
};
