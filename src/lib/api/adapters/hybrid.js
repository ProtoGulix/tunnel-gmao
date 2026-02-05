/**
 * Hybrid Adapter - Dual Backend Mode
 *
 * Combines directus (legacy) and tunnel-backend (new) adapters.
 * Allows progressive migration by routing specific domains to the new backend
 * while keeping everything else on the existing directus backend.
 *
 * Current split (as of 2026-02-03):
 *
 * **Tunnel-backend (Python API):**
 * - stats, machines, equipements
 * - interventions, actions, complexityFactors
 * - purchaseRequests, supplierOrders, supplierOrderLines
 * - stock, suppliers, stockSuppliers (migrated 2026-02-03)
 *
 * **Directus (legacy):**
 * - auth, interventionStatusRefs, actionSubcategories
 * - anomalyConfig, preventive
 * - stockSpecs, manufacturerItems
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

  // Stock families/specs from directus (not yet in tunnel-backend)
  fetchStockFamilies: directusAdapter.stock.fetchStockFamilies,
  fetchStockSubFamilies: directusAdapter.stock.fetchStockSubFamilies,
  fetchStockItemStandardSpecs: directusAdapter.stock.fetchStockItemStandardSpecs,
  createStockItemStandardSpec: directusAdapter.stock.createStockItemStandardSpec,
  updateStockItemStandardSpec: directusAdapter.stock.updateStockItemStandardSpec,
  deleteStockItemStandardSpec: directusAdapter.stock.deleteStockItemStandardSpec,

  // Purchase requests from directus (legacy)
  createPurchaseRequest: directusAdapter.stock.createPurchaseRequest,
  fetchPurchaseRequests: directusAdapter.stock.fetchPurchaseRequests,
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
  // Migrated from Directus (2026-02-03)
  stock: hybridStockAdapter,
  suppliers: tunnelBackendAdapter.suppliers,
  stockSuppliers: tunnelBackendAdapter.stockSuppliers,
};
