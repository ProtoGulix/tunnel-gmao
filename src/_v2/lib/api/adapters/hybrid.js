/**
 * Hybrid Adapter - Dual Backend Mode
 *
 * Combines directus (legacy) and tunnel-backend (new) adapters.
 * Allows progressive migration by routing specific domains to the new backend
 * while keeping everything else on the existing directus backend.
 *
 * Current split (as of 2026-02-19):
 *
 * **Tunnel-backend (Python API):**
 * - stats, machines, equipements
 * - interventions, actions, complexityFactors
 * - supplierOrderLines, partTemplates
 * - stock (items, families, subfamilies), suppliers, stockSuppliers (migrated 2026-02-03)
 * - equipementClasses
 *
 * **Directus (legacy still in use):**
 * - auth, interventionStatusRefs, actionSubcategories
 * - anomalyConfig, preventive
 * - stockSpecs, manufacturerItems
 * - purchaseRequests, supplierOrders (Temporarily using Directus until tunnel-backend endpoints are implemented)
 *
 * @module lib/api/adapters/hybrid
 */

import { adapter as directusAdapter } from './directus';
import { adapter as tunnelBackendAdapter } from './tunnel/adapter';

/**
 * Hybrid stock adapter - combines tunnel-backend (items) + directus (families)
 */
const hybridStockAdapter = {
  // Stock items from tunnel-backend
  fetchStockItems: tunnelBackendAdapter.stock.fetchStockItems,
  createStockItem: tunnelBackendAdapter.stock.createStockItem,
  updateStockItem: tunnelBackendAdapter.stock.updateStockItem,
  deleteStockItem: tunnelBackendAdapter.stock.deleteStockItem,

  // Stock families - READ ONLY from tunnel-backend (v2.1.0)
  // Families are extracted from subfamilies, no direct CRUD
  fetchStockFamilies: tunnelBackendAdapter.stock.fetchStockFamilies,
  fetchStockFamily: tunnelBackendAdapter.stock.fetchStockFamily, // NEW: GET /stock-families/{code}
  createStockFamily: directusAdapter.stock.createStockFamily, // Keep on Directus
  updateStockFamily: directusAdapter.stock.updateStockFamily, // Keep on Directus
  deleteStockFamily: directusAdapter.stock.deleteStockFamily, // Keep on Directus

  // Stock subfamilies - migrated to tunnel-backend (v2.1.0)
  fetchStockSubFamilies: tunnelBackendAdapter.stock.fetchStockSubFamilies,
  createStockSubFamily: tunnelBackendAdapter.stock.createStockSubFamily,
  updateStockSubFamily: tunnelBackendAdapter.stock.updateStockSubFamily,
  deleteStockSubFamily: directusAdapter.stock.deleteStockSubFamily, // Fallback to Directus (needs ID-based deletion)

  fetchStockItemStandardSpecs: directusAdapter.stock.fetchStockItemStandardSpecs,
  createStockItemStandardSpec: directusAdapter.stock.createStockItemStandardSpec,
  updateStockItemStandardSpec: directusAdapter.stock.updateStockItemStandardSpec,
  deleteStockItemStandardSpec: directusAdapter.stock.deleteStockItemStandardSpec,

  // Purchase requests from directus (legacy)
  fetchPurchaseRequests: directusAdapter.stock.fetchPurchaseRequests,
  fetchPurchaseRequestsByIntervention: directusAdapter.stock.fetchPurchaseRequestsByIntervention,
  createPurchaseRequest: directusAdapter.stock.createPurchaseRequest,
  updatePurchaseRequest: directusAdapter.stock.updatePurchaseRequest,
  deletePurchaseRequest: directusAdapter.stock.deletePurchaseRequest,
};

/**
 * Hybrid adapter implementation
 *
 * Routes specific domains to tunnel-backend, delegates the rest to directus
 */
export const adapter = {
  name: 'hybrid',

  // Infrastructure from directus (shared HTTP client)
  client: directusAdapter.client,
  errors: directusAdapter.errors,

  // Directus namespaces (legacy)
  auth: directusAdapter.auth,
  interventionStatusRefs: directusAdapter.interventionStatusRefs,
  actionSubcategories: tunnelBackendAdapter.actionSubcategories,
  anomalyConfig: directusAdapter.anomalyConfig,
  preventive: directusAdapter.preventive,
  stockSpecs: directusAdapter.stockSpecs,
  manufacturerItems: directusAdapter.manufacturerItems,

  // Tunnel-backend namespaces (new)
  stats: tunnelBackendAdapter.stats,
  machines: tunnelBackendAdapter.machines,
  equipements: tunnelBackendAdapter.equipements,
  interventions: tunnelBackendAdapter.interventions,
  actions: tunnelBackendAdapter.actions,
  complexityFactors: tunnelBackendAdapter.complexityFactors,
  purchaseRequests: tunnelBackendAdapter.purchaseRequests,
  supplierOrders: tunnelBackendAdapter.supplierOrders,
  supplierOrderLines: tunnelBackendAdapter.supplierOrderLines,
  partTemplates: tunnelBackendAdapter.partTemplates,
  // Migrated from Directus (2026-02-03)
  stock: hybridStockAdapter,
  suppliers: tunnelBackendAdapter.suppliers,
  stockSuppliers: tunnelBackendAdapter.stockSuppliers,
  equipementClasses: tunnelBackendAdapter.equipementClasses,
};
