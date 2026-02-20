/**
 * Suppliers Adapter - Tunnel Backend
 *
 * Public API for supplier management. Orchestrates datasource and mapper.
 *
 * @module lib/api/adapters/tunnel/suppliers/adapter
 */

import {
  fetchSuppliersRaw,
  fetchSupplierRaw,
  createSupplierRaw,
  updateSupplierRaw,
  deleteSupplierRaw,
  dispatchPurchaseRequestsRaw,
} from './datasource';
import { mapSupplierToFrontend, mapSupplierToBackend } from './mapper';
import { supplierOrderLinesAdapter } from '../supplierOrderLines/adapter';

export const suppliersAdapter = {
  /**
   * Fetch all suppliers
   */
  fetchSuppliers: async (params?: any) => {
    const raw = await fetchSuppliersRaw(params);
    return Array.isArray(raw) ? raw.map(mapSupplierToFrontend) : [];
  },

  /**
   * Fetch a single supplier
   */
  fetchSupplier: async (id: string) => {
    const raw = await fetchSupplierRaw(id);
    return mapSupplierToFrontend(raw);
  },

  /**
   * Create a new supplier
   */
  createSupplier: async (supplier: any) => {
    const payload = mapSupplierToBackend(supplier);
    const raw = await createSupplierRaw(payload);
    return mapSupplierToFrontend(raw);
  },

  /**
   * Update an existing supplier
   */
  updateSupplier: async (id: string, updates: any) => {
    const payload = mapSupplierToBackend(updates);
    const raw = await updateSupplierRaw(id, payload);
    return mapSupplierToFrontend(raw);
  },

  /**
   * Delete a supplier
   */
  deleteSupplier: async (id: string) => {
    await deleteSupplierRaw(id);
  },

  /**
   * Fetch supplier order lines by order ID
   * Alias for backward compatibility - delegates to supplierOrderLines adapter
   */
  fetchSupplierOrderLines: async (orderId: string) => {
    return supplierOrderLinesAdapter.fetchSupplierOrderLinesByOrder(orderId);
  },

  /**
   * Dispatch purchase requests with PENDING_DISPATCH status to supplier orders
   * POST /purchase-requests/dispatch
   * Returns: { dispatched_count, created_orders, errors }
   */
  dispatchPurchaseRequests: async () => {
    const result = await dispatchPurchaseRequestsRaw();
    return {
      dispatched: result.dispatched_count || 0,
      createdOrders: result.created_orders || 0,
      errors: result.errors || [],
    };
  },

  // Stubs for methods not yet implemented
  purgeSupplierOrder: undefined,
};
