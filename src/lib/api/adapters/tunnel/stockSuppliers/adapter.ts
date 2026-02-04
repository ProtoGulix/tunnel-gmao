/**
 * Stock Item Suppliers Adapter - Tunnel Backend
 *
 * Public API for stock-supplier links. Orchestrates datasource and mapper.
 *
 * @module lib/api/adapters/tunnel/stockSuppliers/adapter
 */

import {
  fetchStockItemSuppliersRaw,
  fetchStockItemSuppliersForItemRaw,
  createStockItemSupplierRaw,
  updateStockItemSupplierRaw,
  deleteStockItemSupplierRaw,
  setPreferredStockItemSupplierRaw,
} from './datasource';
import { mapStockItemSupplierToFrontend, mapStockItemSupplierToBackend } from './mapper';

export const stockSuppliersAdapter = {
  /**
   * Fetch all stock item supplier references
   */
  fetchStockItemSuppliers: async (params?: any) => {
    const raw = await fetchStockItemSuppliersRaw(params);
    return Array.isArray(raw) ? raw.map(mapStockItemSupplierToFrontend) : [];
  },

  /**
   * Fetch supplier references for a specific stock item
   */
  fetchStockItemSuppliersForItem: async (stockItemId: string) => {
    const raw = await fetchStockItemSuppliersForItemRaw(stockItemId);
    return Array.isArray(raw) ? raw.map(mapStockItemSupplierToFrontend) : [];
  },

  /**
   * Create a new stock item supplier reference
   */
  createStockItemSupplier: async (ref: any) => {
    const payload = mapStockItemSupplierToBackend(ref);
    const raw = await createStockItemSupplierRaw(payload);
    return mapStockItemSupplierToFrontend(raw);
  },

  /**
   * Update an existing stock item supplier reference
   */
  updateStockItemSupplier: async (id: string, updates: any) => {
    const payload = mapStockItemSupplierToBackend(updates);
    const raw = await updateStockItemSupplierRaw(id, payload);
    return mapStockItemSupplierToFrontend(raw);
  },

  /**
   * Set a reference as preferred
   */
  setPreferredStockItemSupplier: async (id: string) => {
    const raw = await setPreferredStockItemSupplierRaw(id);
    return mapStockItemSupplierToFrontend(raw);
  },

  /**
   * Delete a stock item supplier reference
   */
  deleteStockItemSupplier: async (id: string) => {
    await deleteStockItemSupplierRaw(id);
  },
};
