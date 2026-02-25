/**
 * @fileoverview Configuration de la page Équipements pour le menu
 * @module pages/equipements/EquipementsPage.config
 */

import { Factory } from 'lucide-react';

/**
 * Configuration de la page Équipements pour l'auto-discovery du menu
 */
export const PAGE_CONFIG = {
  id: 'equipements',
  path: '/equipements',
  label: 'Équipements',
  icon: Factory,
  pageTitle: 'Gestion des Équipements',
  pageSubtitle: "Parc d'équipements avec état de santé et classification",
  section: 'maintenance',
  requiresAuth: true,
  public: false,
  order: 20,
};
