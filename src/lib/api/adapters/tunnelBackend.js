/**
 * Tunnel Backend Adapter
 *
 * Implements the stable API contract against the tunnel-backend manifest.
 * Only a subset of domains is currently supported (auth, interventions,
 * actions, action subcategories, machines, stats). The remaining namespaces
 * throw explicit errors to surface unsupported features quickly.
 */

import axios from 'axios';
import { clearAllCache } from '@/lib/api/client';
import * as errors from '@/lib/api/errors';
import { statsAdapter as stats } from './stats/adapter.ts';

// Instance axios dédiée pour tunnel-backend
const TUNNEL_BACKEND_URL = import.meta.env.VITE_TUNNEL_BACKEND_URL || 'http://localhost:8000';

const tunnelApi = axios.create({
  baseURL: TUNNEL_BACKEND_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Ajouter le token d'authentification si disponible
tunnelApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const notImplemented = (fnName) => async () => {
  throw new errors.APIError(`${fnName} not implemented for tunnel-backend`, 501);
};

const mapStatus = (status) => {
  if (!status) return 'open';
  const normalized = String(status).toLowerCase();
  if (['open', 'in_progress', 'closed'].includes(normalized)) return normalized;
  if (normalized === 'in-progress') return 'in_progress';
  return 'open';
};

const mapAction = (action = {}) => ({
  id: action.id?.toString() || '',
  description: action.description || '',
  timeSpent: Number(action.time_spent ?? action.timeSpent ?? 0),
  complexityScore: action.complexity_score ?? action.complexityScore,
  createdAt: action.created_at || action.updated_at || new Date().toISOString(),
  technician: action.tech ? { id: String(action.tech), firstName: '', lastName: '' } : undefined,
  subcategory: action.subcategory
    ? {
        id: String(action.subcategory.id),
        code: action.subcategory.code || undefined,
        name: action.subcategory.name || undefined,
      }
    : undefined,
  intervention: action.intervention_id ? { id: String(action.intervention_id) } : undefined,
});

const mapIntervention = (raw = {}) => ({
  id: raw.id?.toString() || '',
  code: raw.code || '',
  title: raw.title || raw.description || '',
  status: mapStatus(raw.status_actual || raw.status),
  type: raw.type_inter || raw.type || 'CUR',
  priority: raw.priority,
  createdAt: raw.reported_date || raw.created_at,
  reportedDate: raw.reported_date,
  printedFiche: raw.printed_fiche,
  techInitials: raw.tech_initials,
  machine: raw.equipements
    ? {
        id: raw.equipements.id?.toString() || '',
        code: raw.equipements.code || undefined,
        name: raw.equipements.name || raw.equipements.code || 'Équipement',
      }
    : undefined,
});

// Mapper pour GET /equipements (liste)
const mapEquipement = (raw = {}) => ({
  id: raw.id?.toString() || '',
  code: raw.code || undefined,
  name: raw.name || raw.code || 'Équipement',
  health: {
    level: raw.health?.level || 'ok',
    reason: raw.health?.reason || 'Aucun point bloquant',
  },
  parentId: raw.parent_id || null,
});

// Mapper pour GET /equipements/{id} (détail)
const mapEquipementDetail = (raw = {}) => ({
  id: raw.id?.toString() || '',
  code: raw.code || undefined,
  name: raw.name || raw.code || 'Équipement',
  health: {
    level: raw.health?.level || 'ok',
    reason: raw.health?.reason || 'Aucun point bloquant',
    rulesTriggered: raw.health?.rules_triggered || [],
  },
  parentId: raw.parent_id || null,
  childrenIds: Array.isArray(raw.children_ids) ? raw.children_ids : [],
});

// Mapper pour GET /equipements/{id}/stats
const mapEquipementStats = (raw = {}) => ({
  interventions: {
    open: raw.interventions?.open ?? 0,
    closed: raw.interventions?.closed ?? 0,
    byStatus: raw.interventions?.by_status || {},
    byPriority: raw.interventions?.by_priority || {},
  },
});

const mapDecisionalIntervention = (raw = {}) => ({
  id: raw.id?.toString() || '',
  code: raw.code || '',
  title: raw.title || '',
  status: mapStatus(raw.status),
  type: raw.type_inter || 'CUR',
  priority: raw.priority,
  reportedDate: raw.reported_date,
  closedDate: raw.closed_date,
});

const mapDecisionalAction = (raw = {}) => ({
  id: raw.id?.toString() || '',
  interventionId: raw.intervention_id?.toString() || '',
  timeSpent: Number(raw.time_spent ?? 0),
  createdAt: raw.created_at || new Date().toISOString(),
});

const auth = {
  async login(email, password) {
    return errors.apiCall(async () => {
      const { data } = await tunnelApi.post('/auth/login', { email, password, mode: 'session' });
      const tokens = data?.data || data;
      const accessToken = tokens?.access_token;
      const refreshToken = tokens?.refresh_token;

      if (accessToken) localStorage.setItem('auth_access_token', accessToken);
      if (refreshToken) localStorage.setItem('auth_refresh_token', refreshToken);

      return {
        accessToken: accessToken || '',
        refreshToken: refreshToken || '',
        expires: tokens?.expires,
      };
    }, 'TunnelAuth.login');
  },
  async logout() {
    localStorage.removeItem('auth_access_token');
    localStorage.removeItem('auth_refresh_token');
  },
  async getCurrentUser() {
    throw new errors.APIError('getCurrentUser not available on tunnel-backend', 501);
  },
  async refreshToken() {
    throw new errors.APIError('refreshToken not available on tunnel-backend', 501);
  },
};

const interventions = {
  async fetchInterventions() {
    return errors.apiCall(async () => {
      const response = await tunnelApi.get('/interventions', { params: { skip: 0, limit: 100 } });
      const list = Array.isArray(response.data) ? response.data : response.data?.data || [];
      return (list || []).map(mapIntervention);
    }, 'TunnelInterventions.fetchInterventions');
  },
  async fetchIntervention(id) {
    return errors.apiCall(async () => {
      const response = await tunnelApi.get(`/interventions/${id}`);
      const raw = response.data?.data || response.data || {};
      const intervention = mapIntervention(raw);

      if (Array.isArray(raw.actions)) {
        intervention.actions = raw.actions.map(mapAction);
      }

      return intervention;
    }, 'TunnelInterventions.fetchIntervention');
  },
  createIntervention: notImplemented('Interventions.createIntervention'),
  updateIntervention: notImplemented('Interventions.updateIntervention'),
  addAction: notImplemented('Interventions.addAction'),
  addPart: notImplemented('Interventions.addPart'),
};

const interventionStatusRefs = {
  async fetchStatusRefs() {
    return errors.apiCall(async () => {
      const response = await tunnelApi.get('/intervention_status');
      const list = Array.isArray(response.data) ? response.data : response.data?.data || [];
      return list.map((item) => ({
        id: item?.id?.toString() || '',
        name: item?.name || '',
        color: item?.color || undefined,
      }));
    }, 'TunnelInterventionStatusRefs.fetchStatusRefs');
  },
};

const interventionStatusLogs = {
  fetchInterventionStatusLog: notImplemented('InterventionStatusLogs.fetchInterventionStatusLog'),
};

const actions = {
  async fetchActions(interventionId) {
    return errors.apiCall(async () => {
      if (interventionId) {
        const { data } = await tunnelApi.get(`/interventions/${interventionId}/actions`);
        const list = Array.isArray(data) ? data : data?.data || [];
        return list.map(mapAction);
      }

      const response = await tunnelApi.get('/intervention_actions');
      const list = Array.isArray(response.data) ? response.data : response.data?.data || [];
      return list.map(mapAction);
    }, 'TunnelActions.fetchActions');
  },
  createAction: notImplemented('Actions.createAction'),
  updateAction: notImplemented('Actions.updateAction'),
  deleteAction: notImplemented('Actions.deleteAction'),
};

const actionSubcategories = {
  async fetchSubcategories() {
    return errors.apiCall(async () => {
      const response = await tunnelApi.get('/action_subcategories');
      const list = Array.isArray(response.data) ? response.data : response.data?.data || [];
      return list.map((item) => ({
        id: item?.id?.toString() || '',
        code: item?.code || undefined,
        name: item?.name || '',
      }));
    }, 'TunnelActionSubcategories.fetchSubcategories');
  },
};

const anomalyConfig = {
  fetchAnomalyConfiguration: notImplemented('AnomalyConfig.fetchAnomalyConfiguration'),
  fetchCategoryMeta: notImplemented('AnomalyConfig.fetchCategoryMeta'),
  fetchClassificationProbes: notImplemented('AnomalyConfig.fetchClassificationProbes'),
  fetchThresholds: notImplemented('AnomalyConfig.fetchThresholds'),
  invalidateCache: async () => {},
};

const equipements = {
  async fetchEquipements() {
    return errors.apiCall(async () => {
      const response = await tunnelApi.get('/equipements');
      const list = Array.isArray(response.data) ? response.data : response.data?.data || [];
      return list.map(mapEquipement);
    }, 'TunnelEquipements.fetchEquipements');
  },
  async fetchEquipement(id) {
    return errors.apiCall(async () => {
      const response = await tunnelApi.get(`/equipements/${id}`);
      const raw = response.data?.data || response.data || {};
      return mapEquipementDetail(raw);
    }, 'TunnelEquipements.fetchEquipement');
  },
  async fetchEquipementStats(id, startDate, endDate) {
    return errors.apiCall(async () => {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const response = await tunnelApi.get(`/equipements/${id}/stats`, { params });
      const raw = response.data?.data || response.data || {};
      return mapEquipementStats(raw);
    }, 'TunnelEquipements.fetchEquipementStats');
  },
  async fetchEquipementHealth(id) {
    return errors.apiCall(async () => {
      const response = await tunnelApi.get(`/equipements/${id}/health`);
      const raw = response.data?.data || response.data || {};
      return {
        level: raw.level || 'ok',
        reason: raw.reason || 'Aucun point bloquant',
      };
    }, 'TunnelEquipements.fetchEquipementHealth');
  },
};

const machines = {
  async fetchMachines() {
    return errors.apiCall(async () => {
      const response = await tunnelApi.get('/equipements');
      const list = Array.isArray(response.data) ? response.data : response.data?.data || [];
      return list.map(mapEquipement);
    }, 'TunnelMachines.fetchMachines');
  },
  async fetchMachine(id) {
    return errors.apiCall(async () => {
      const response = await tunnelApi.get(`/equipements/${id}`);
      const raw = response.data?.data || response.data || {};
      return mapEquipementDetail(raw);
    }, 'TunnelMachines.fetchMachine');
  },
  async fetchMachinesWithInterventions() {
    return errors.apiCall(async () => {
      const response = await tunnelApi.get('/equipements');
      const list = Array.isArray(response.data) ? response.data : response.data?.data || [];
      return list.map(mapEquipement);
    }, 'TunnelMachines.fetchMachinesWithInterventions');
  },
  async fetchMachineDetail(id) {
    return errors.apiCall(async () => {
      const response = await tunnelApi.get(`/equipements/${id}`);
      const raw = response.data?.data || response.data || {};
      return mapEquipementDetail(raw);
    }, 'TunnelMachines.fetchMachineDetail');
  },
  async fetchSubEquipements(id) {
    return errors.apiCall(async () => {
      const response = await tunnelApi.get(`/equipements/${id}`);
      const raw = response.data?.data || response.data || {};
      
      if (!Array.isArray(raw.children_ids)) {
        return [];
      }

      // Récupérer les détails des enfants (devrait être fait via cache)
      return Promise.all(
        raw.children_ids.map((childId) =>
          equipements.fetchEquipement(childId).catch(() => null)
        )
      ).then((results) => results.filter(Boolean));
    }, 'TunnelMachines.fetchSubEquipements');
  },
  updateMachine: notImplemented('Machines.updateMachine'),
};

const preventive = {
  fetchAllPreventiveSuggestions: notImplemented('Preventive.fetchAllPreventiveSuggestions'),
  fetchPreventiveSuggestions: notImplemented('Preventive.fetchPreventiveSuggestions'),
  acceptPreventiveSuggestion: notImplemented('Preventive.acceptPreventiveSuggestion'),
  rejectPreventiveSuggestion: notImplemented('Preventive.rejectPreventiveSuggestion'),
  reviewPreventiveSuggestion: notImplemented('Preventive.reviewPreventiveSuggestion'),
};

const stock = {
  fetchStockItems: notImplemented('Stock.fetchStockItems'),
  createStockItem: notImplemented('Stock.createStockItem'),
  updateStockItem: notImplemented('Stock.updateStockItem'),
  deleteStockItem: notImplemented('Stock.deleteStockItem'),
  fetchStockItemStandardSpecs: notImplemented('Stock.fetchStockItemStandardSpecs'),
  createStockItemStandardSpec: notImplemented('Stock.createStockItemStandardSpec'),
  updateStockItemStandardSpec: notImplemented('Stock.updateStockItemStandardSpec'),
  deleteStockItemStandardSpec: notImplemented('Stock.deleteStockItemStandardSpec'),
  fetchStockFamilies: notImplemented('Stock.fetchStockFamilies'),
  fetchStockSubFamilies: notImplemented('Stock.fetchStockSubFamilies'),
  createPurchaseRequest: notImplemented('Stock.createPurchaseRequest'),
  fetchPurchaseRequests: notImplemented('Stock.fetchPurchaseRequests'),
};

const suppliers = {
  fetchSuppliers: notImplemented('Suppliers.fetchSuppliers'),
  fetchSupplier: notImplemented('Suppliers.fetchSupplier'),
  createSupplier: notImplemented('Suppliers.createSupplier'),
  updateSupplier: notImplemented('Suppliers.updateSupplier'),
  deleteSupplier: notImplemented('Suppliers.deleteSupplier'),
  purgeSupplierOrder: notImplemented('Suppliers.purgeSupplierOrder'),
  dispatchPurchaseRequests: notImplemented('Suppliers.dispatchPurchaseRequests'),
};

const stockSuppliers = {
  fetchStockItemSuppliers: notImplemented('StockSuppliers.fetchStockItemSuppliers'),
  createStockItemSupplier: notImplemented('StockSuppliers.createStockItemSupplier'),
  updateStockItemSupplier: notImplemented('StockSuppliers.updateStockItemSupplier'),
  deleteStockItemSupplier: notImplemented('StockSuppliers.deleteStockItemSupplier'),
};

const stockSpecs = {
  fetchStockSpecs: notImplemented('StockSpecs.fetchStockSpecs'),
  fetchStockSpecsForItem: notImplemented('StockSpecs.fetchStockSpecsForItem'),
  createStockSpec: notImplemented('StockSpecs.createStockSpec'),
  updateStockSpec: notImplemented('StockSpecs.updateStockSpec'),
  deleteStockSpec: notImplemented('StockSpecs.deleteStockSpec'),
};

const manufacturerItems = {
  findManufacturerItem: notImplemented('ManufacturerItems.findManufacturerItem'),
  createManufacturerItem: notImplemented('ManufacturerItems.createManufacturerItem'),
  getOrCreateManufacturerItem: notImplemented('ManufacturerItems.getOrCreateManufacturerItem'),
};

export const adapter = {
  name: 'tunnel-backend',
  client: { api: tunnelApi, BASE_URL: TUNNEL_BACKEND_URL, clearAllCache },
  errors,
  auth,
  interventions,
  interventionStatusRefs,
  interventionStatusLogs,
  actions,
  actionSubcategories,
  anomalyConfig,
  equipements,
  machines,
  preventive,
  stock,
  stockSpecs,
  manufacturerItems,
  suppliers,
  stockSuppliers,
  stats,
};
