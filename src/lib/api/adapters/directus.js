/**
 * Directus Adapter
 *
 * Implements the stable API contract for the frontend by mapping Directus responses
 * to domain DTOs (Data Transfer Objects). Serves as the backend abstraction layer.
 *
 * @module adapters/directus
 *
 * DTO Overview:
 * - All responses are mapped to domain DTOs (no backend-specific fields exposed)
 * - See {@link ../../../docs/tech/API_CONTRACTS.md} for complete DTO definitions
 * - Adapters validate inputs/outputs at boundaries
 *
 * Namespaces (from domain adapters):
 * @typedef {Object} DirectusAdapter
 * @property {string} name - "directus"
 * @property {Object} client - Raw HTTP client and config
 * @property {Object} errors - Unified error types
 * @property {Object} auth - Authentication namespace
 * @property {Object} interventions - Interventions namespace
 * @property {Object} interventionStatusRefs - Status references namespace
 * @property {Object} interventionStatusLogs - Status logs namespace
 * @property {Object} actions - Actions namespace
 * @property {Object} actionSubcategories - Action subcategories namespace
 * @property {Object} machines - Machines namespace
 * @property {Object} stock - Stock items namespace
 * @property {Object} suppliers - Suppliers namespace
 * @property {Object} stockSuppliers - Stock-supplier links namespace
 * @property {Object} stockSpecs - Stock specs namespace
 * @property {Object} manufacturerItems - Manufacturer items namespace
 */

// ==============================
// DOMAIN ADAPTERS (sorted alphabetically for readability)
// ==============================
import { actionSubcategoriesAdapter as actionSubcategories } from './directus/actionSubcategories/adapter.ts';
import { actionsAdapter as actions } from './directus/actions/adapter';
import { anomalyConfigAdapter as anomalyConfig } from './directus/anomalyConfig/adapter';
import { authAdapter as auth } from './directus/auth/adapter';
import { interventionStatusLogsAdapter as interventionStatusLogs } from './directus/interventionStatusLogs/adapter';
import { interventionStatusRefsAdapter as interventionStatusRefs } from './directus/interventionStatusRefs/adapter';
import { interventionsAdapter as interventions } from './directus/interventions/adapter';
import { machinesAdapter as machines } from './directus/machines/adapter';
import { manufacturerItemsAdapter as manufacturerItems } from './directus/manufacturerItems/adapter';
import { stockAdapter as stock } from './directus/stock/adapter';
import { stockSpecsAdapter as stockSpecs } from './directus/stockSpecs/adapter';
import { stockSuppliersAdapter as stockSuppliers } from './directus/stockSuppliers/adapter';
import { suppliersAdapter as suppliers } from './directus/suppliers/adapter';

// ==============================
// INFRASTRUCTURE
// ==============================
import { api, BASE_URL, clearAllCache } from '@/lib/api/client';
import * as errors from '@/lib/api/errors';

// ==============================
// ADAPTER EXPORT
// ==============================

/**
 * Directus implementation of the stable API contract.
 *
 * Usage:
 * ```javascript
 * import { adapter } from './directus';
 * const user = await adapter.auth.getCurrentUser();
 * const machines = await adapter.machines.fetchMachines();
 * ```
 *
 * @type {DirectusAdapter}
 */
export const adapter = {
  name: 'directus',
  client: { api, BASE_URL, clearAllCache },
  errors,
  // Auth & Account
  auth,
  // Interventions & Actions
  interventions,
  interventionStatusRefs,
  interventionStatusLogs,
  actions,
  actionSubcategories,
  // Anomaly Configuration
  anomalyConfig,
  // Machines
  machines,
  // Stock Management
  stock,
  stockSpecs,
  manufacturerItems,
  // Suppliers & Purchasing
  suppliers,
  stockSuppliers,
};
