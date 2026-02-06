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
    if (typeof params === 'string' || typeof params === 'number') {
      const raw = await fetchStockItemSuppliersForItemRaw(String(params));
      return Array.isArray(raw) ? raw.map(mapStockItemSupplierToFrontend) : [];
    }

    if (params && typeof params === 'object' && params.stock_item_id) {
      const raw = await fetchStockItemSuppliersForItemRaw(String(params.stock_item_id));
      return Array.isArray(raw) ? raw.map(mapStockItemSupplierToFrontend) : [];
    }

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
   * Fetch supplier references for multiple stock items
   */
  fetchStockItemSuppliersBulk: async (stockItemIds: string[]) => {
    const ids = Array.isArray(stockItemIds) ? stockItemIds.filter(Boolean) : [];
    if (ids.length === 0) return {};

    const results = await Promise.all(
      ids.map(async (id) => ({
        id,
        refs: await stockSuppliersAdapter.fetchStockItemSuppliersForItem(String(id)),
      }))
    );

    return results.reduce<Record<string, any[]>>((acc, entry) => {
      acc[entry.id] = entry.refs || [];
      return acc;
    }, {});
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
