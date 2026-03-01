/**
 * @fileoverview Configuration de la page Stock pour le menu
 * @module pages/stock/StockPage.config
 */

import { Package } from 'lucide-react';

export const PAGE_CONFIG = {
  id: 'stock',
  path: '/stock',
  label: 'Stock',
  icon: Package,
  pageTitle: 'Stock',
  pageSubtitle: 'Pieces referencees et familles',
  section: 'stock',
  requiresAuth: true,
  public: false,
  order: 30,
};
