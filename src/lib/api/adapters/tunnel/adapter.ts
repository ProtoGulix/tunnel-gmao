/**
 * Tunnel Backend Adapter (Main Composer)
 *
 * Composes all domain-specific adapters (auth, interventions, equipements, etc.)
 * into a unified API contract.
 *
 * Structure:
 * - Each domain has its own datasource/mapper/adapter triplet
 * - Main adapter orchestrates and exposes domain interfaces
 * - No business logic here, pure composition
 *
 * @module lib/api/adapters/tunnel/adapter
 */

import { authAdapter } from './auth/adapter';
import { interventionsAdapter } from './interventions/adapter';
import { actionsAdapter } from './actions/adapter';
import { equipementsAdapter } from './equipements/adapter';
import { interventionStatusRefsAdapter } from './interventionStatusRefs/adapter';
import { actionSubcategoriesAdapter } from './actionSubcategories/adapter';
import { complexityFactorsAdapter } from './complexityFactors/adapter';
import { statsAdapter } from './stats/adapter';
import { purchaseRequestsAdapter } from './purchaseRequests/adapter';
import { supplierOrdersAdapter } from './supplierOrders/adapter';
import { supplierOrderLinesAdapter } from './supplierOrderLines/adapter';
import { stockAdapter } from './stock/adapter';
import { suppliersAdapter } from './suppliers/adapter';
import { stockSuppliersAdapter } from './stockSuppliers/adapter';
import { equipementClassesAdapter } from './equipementClasses/adapter';
import { clearAllCache } from '@/lib/api/client';

// ============================================================================
// Stubs for unimplemented domains
// ============================================================================

const anomalyConfig = {
  fetchAnomalyConfiguration: undefined,
  fetchCategoryMeta: undefined,
  fetchClassificationProbes: undefined,
  fetchThresholds: undefined,
  invalidateCache: async () => {},
};

const preventive = {
  fetchAllPreventiveSuggestions: undefined,
  fetchPreventiveSuggestions: undefined,
  acceptPreventiveSuggestion: undefined,
  rejectPreventiveSuggestion: undefined,
  reviewPreventiveSuggestion: undefined,
};

const stockSpecs = {
  fetchStockSpecs: undefined,
  fetchStockSpecsForItem: undefined,
  createStockSpec: undefined,
  updateStockSpec: undefined,
  deleteStockSpec: undefined,
};

const manufacturerItems = {
  findManufacturerItem: undefined,
  createManufacturerItem: undefined,
  getOrCreateManufacturerItem: undefined,
};

// ============================================================================
// Adapter Export
// ============================================================================

export const adapter = {
  name: 'tunnel-backend',
  client: { api: undefined, BASE_URL: import.meta.env.VITE_TUNNEL_BACKEND_URL, clearAllCache },
  auth: authAdapter,
  interventions: interventionsAdapter,
  interventionStatusRefs: interventionStatusRefsAdapter,
  actions: actionsAdapter,
  actionSubcategories: actionSubcategoriesAdapter,
  complexityFactors: complexityFactorsAdapter,
  anomalyConfig,
  equipements: equipementsAdapter,
  machines: equipementsAdapter, // Alias pour compatibilité
  preventive,
  stock: stockAdapter,
  stockSpecs,
  manufacturerItems,
  suppliers: suppliersAdapter,
  stockSuppliers: stockSuppliersAdapter,
  stats: statsAdapter,
  purchaseRequests: purchaseRequestsAdapter,
  supplierOrders: supplierOrdersAdapter,
  supplierOrderLines: supplierOrderLinesAdapter,
  equipementClasses: equipementClassesAdapter,
};
