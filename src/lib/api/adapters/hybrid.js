/**
 * Hybrid Adapter - Dual Backend Mode
 *
 * Combines directus (legacy) and tunnel-backend (new) adapters.
 * Allows progressive migration by routing specific domains to the new backend
 * while keeping everything else on the existing directus backend.
 *
 * Current split:
 * - stats → tunnel-backend
 * - machines → tunnel-backend
 * - everything else → directus
 *
 * @module lib/api/adapters/hybrid
 */

import { adapter as directusAdapter } from './directus';
import { adapter as tunnelBackendAdapter } from './tunnelBackend';

/**
 * Hybrid adapter implementation
 *
 * Routes stats to tunnel-backend, delegates everything else to directus
 */
export const adapter = {
  name: 'hybrid',

  // Infrastructure from directus (shared HTTP client)
  client: directusAdapter.client,
  errors: directusAdapter.errors,

  // Directus namespaces
  auth: directusAdapter.auth,
  interventions: directusAdapter.interventions,
  interventionStatusRefs: directusAdapter.interventionStatusRefs,
  interventionStatusLogs: directusAdapter.interventionStatusLogs,
  actions: directusAdapter.actions,
  actionSubcategories: directusAdapter.actionSubcategories,
  anomalyConfig: directusAdapter.anomalyConfig,
  preventive: directusAdapter.preventive,
  stock: directusAdapter.stock,
  stockSpecs: directusAdapter.stockSpecs,
  manufacturerItems: directusAdapter.manufacturerItems,
  suppliers: directusAdapter.suppliers,
  stockSuppliers: directusAdapter.stockSuppliers,

  // Tunnel-backend namespaces
  stats: tunnelBackendAdapter.stats,
  machines: tunnelBackendAdapter.machines,
};
