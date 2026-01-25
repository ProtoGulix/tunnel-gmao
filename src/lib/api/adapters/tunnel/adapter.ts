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
import { statsAdapter } from './stats/adapter';
import { clearAllCache } from '@/lib/api/client';

// ============================================================================
// Stubs for unimplemented domains
// ============================================================================

const interventionStatusLogs = {
  fetchInterventionStatusLog: undefined,
};

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

const stock = {
  fetchStockItems: undefined,
  createStockItem: undefined,
  updateStockItem: undefined,
  deleteStockItem: undefined,
  fetchStockItemStandardSpecs: undefined,
  createStockItemStandardSpec: undefined,
  updateStockItemStandardSpec: undefined,
  deleteStockItemStandardSpec: undefined,
  fetchStockFamilies: undefined,
  fetchStockSubFamilies: undefined,
  createPurchaseRequest: undefined,
  fetchPurchaseRequests: undefined,
};

const suppliers = {
  fetchSuppliers: undefined,
  fetchSupplier: undefined,
  createSupplier: undefined,
  updateSupplier: undefined,
  deleteSupplier: undefined,
  purgeSupplierOrder: undefined,
  dispatchPurchaseRequests: undefined,
};

const stockSuppliers = {
  fetchStockItemSuppliers: undefined,
  createStockItemSupplier: undefined,
  updateStockItemSupplier: undefined,
  deleteStockItemSupplier: undefined,
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
  interventionStatusLogs,
  actions: actionsAdapter,
  actionSubcategories: actionSubcategoriesAdapter,
  anomalyConfig,
  equipements: equipementsAdapter,
  preventive,
  stock,
  stockSpecs,
  manufacturerItems,
  suppliers,
  stockSuppliers,
  stats: statsAdapter,
};
