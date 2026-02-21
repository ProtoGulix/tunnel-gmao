import { Home } from 'lucide-react';

/**
 * Configuration de la page d'accueil
 * @module pages/home/HomePage.config
 */

export const PAGE_CONFIG = {
  id: 'home',
  path: '/',
  label: 'Accueil',
  icon: Home,
  pageTitle: 'Accueil',
  pageSubtitle: "Bienvenue dans l'application GMAO",
  requiresAuth: true,
  showInMenu: true,
};
