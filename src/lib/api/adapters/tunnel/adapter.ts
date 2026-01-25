/**
 * Tunnel Backend Adapter
 *
 * Backend-agnostic domain interface. Orchestrates datasource + mapper only.
 * No backend-specific logic. No HTTP calls. No tunnel-backend field names exposed.
 *
 * Uses:
 * - apiCall wrapper (error handling)
 * - Logical cache tags (not URL paths)
 * - Domain DTOs (as defined in API_CONTRACTS.md)
 *
 * @module lib/api/adapters/tunnel/adapter
 */

import { apiCall } from '@/lib/api/errors';
import { invalidateCache, clearAllCache } from '@/lib/api/client';
import * as datasource from './datasource';
import * as mapper from './mapper';
import { statsAdapter } from './stats/adapter';

// ============================================================================
// Auth
// ============================================================================

const auth = {
  async login(email: string, password: string) {
    return apiCall(async () => {
      const raw = await datasource.loginRaw(email, password);
      return mapper.mapAuthTokens(raw);
    }, 'TunnelAuth.login');
  },

  async logout() {
    return apiCall(async () => {
      await datasource.logoutRaw();
      clearAllCache();
    }, 'TunnelAuth.logout');
  },

  async getCurrentUser() {
    throw new Error('getCurrentUser not implemented for tunnel-backend');
  },

  async refreshToken() {
    throw new Error('refreshToken not implemented for tunnel-backend');
  },
};

// ============================================================================
// Interventions
// ============================================================================

const interventions = {
  async fetchInterventions(filters: any = {}) {
    return apiCall(async () => {
      const raw = await datasource.fetchInterventionsRaw(filters);
      return raw.map(mapper.mapInterventionToDomain).filter(Boolean);
    }, 'TunnelInterventions.fetchInterventions');
  },

  async fetchIntervention(id: string) {
    return apiCall(async () => {
      const raw = await datasource.fetchInterventionRaw(id);
      const intervention = mapper.mapInterventionToDomain(raw);

      // Map nested actions if present
      if (Array.isArray(raw.actions)) {
        intervention.actions = raw.actions.map(mapper.mapActionToDomain).filter(Boolean);
      }

      return intervention;
    }, `TunnelInterventions.fetchIntervention:${id}`);
  },

  createIntervention: undefined,
  updateIntervention: undefined,
  addAction: undefined,
  addPart: undefined,
};

// ============================================================================
// Intervention Status Refs
// ============================================================================

const interventionStatusRefs = {
  async fetchStatusRefs() {
    return apiCall(async () => {
      const raw = await datasource.fetchStatusRefsRaw();
      return raw.map(mapper.mapStatusRefToDomain).filter(Boolean);
    }, 'TunnelInterventionStatusRefs.fetchStatusRefs');
  },
};

// ============================================================================
// Actions
// ============================================================================

const actions = {
  async fetchActions(interventionId?: string) {
    return apiCall(async () => {
      const raw = await datasource.fetchActionsRaw(interventionId);
      return raw.map(mapper.mapActionToDomain).filter(Boolean);
    }, interventionId ? `TunnelActions.fetchActions:${interventionId}` : 'TunnelActions.fetchActions');
  },

  createAction: undefined,
  updateAction: undefined,
  deleteAction: undefined,
};

// ============================================================================
// Action Subcategories
// ============================================================================

const actionSubcategories = {
  async fetchSubcategories() {
    return apiCall(async () => {
      const raw = await datasource.fetchSubcategoriesRaw();
      return raw.map(mapper.mapSubcategoryToDomain).filter(Boolean);
    }, 'TunnelActionSubcategories.fetchSubcategories');
  },
};

// ============================================================================
// Equipements
// ============================================================================

const equipements = {
  async fetchEquipements() {
    return apiCall(async () => {
      const raw = await datasource.fetchEquipementsRaw();
      return raw.map(mapper.mapEquipementToDomain).filter(Boolean);
    }, 'TunnelEquipements.fetchEquipements');
  },

  async fetchEquipement(id: string) {
    return apiCall(async () => {
      const raw = await datasource.fetchEquipementRaw(id);
      return mapper.mapEquipementDetailToDomain(raw);
    }, `TunnelEquipements.fetchEquipement:${id}`);
  },

  async fetchEquipementStats(id: string, startDate?: string, endDate?: string) {
    return apiCall(async () => {
      const raw = await datasource.fetchEquipementStatsRaw(id, startDate, endDate);
      return mapper.mapEquipementStatsToDomain(raw);
    }, `TunnelEquipements.fetchEquipementStats:${id}`);
  },

  async fetchEquipementHealth(id: string) {
    return apiCall(async () => {
      const raw = await datasource.fetchEquipementHealthRaw(id);
      return {
        level: raw.level || 'ok',
        reason: raw.reason || 'Aucun point bloquant',
      };
    }, `TunnelEquipements.fetchEquipementHealth:${id}`);
  },
};

// ============================================================================
// Stats (via stats/adapter)
// ============================================================================

const stats = statsAdapter;

// ============================================================================
// Stubs for unimplemented domains
// ============================================================================

const notImplemented = (domain: string) => ({
  [domain]: () => {
    throw new Error(`${domain} not implemented for tunnel-backend`);
  },
});

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
  client: { api: datasource, BASE_URL: process.env.VITE_TUNNEL_BACKEND_URL, clearAllCache },
  auth,
  interventions,
  interventionStatusRefs,
  interventionStatusLogs,
  actions,
  actionSubcategories,
  anomalyConfig,
  equipements,
  preventive,
  stock,
  stockSpecs,
  manufacturerItems,
  suppliers,
  stockSuppliers,
  stats,
};
