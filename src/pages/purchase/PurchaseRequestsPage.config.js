/**
 * @fileoverview Configuration de la page Demandes d'achat pour le menu
 * @module pages/purchase/PurchaseRequestsPage.config
 */

import { ShoppingCart } from 'lucide-react';

export const PAGE_CONFIG = {
  id: 'purchase-requests',
  path: '/achats',
  label: "Demandes d'achat",
  icon: ShoppingCart,
  pageTitle: "Demandes d'achat",
  pageSubtitle: "Gestion et dispatch des demandes d'achat",
  section: 'stock',
  requiresAuth: true,
  public: false,
  order: 40,
};
