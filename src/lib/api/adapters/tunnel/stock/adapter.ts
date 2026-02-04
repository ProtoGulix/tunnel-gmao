/**
 * Stock Items Adapter - Tunnel Backend
 *
 * Public API for stock management. Orchestrates datasource and mapper.
 *
 * @module lib/api/adapters/tunnel/stock/adapter
 */

import {
  fetchStockItemsRaw,
  fetchStockItemRaw,
  createStockItemRaw,
  updateStockItemRaw,
  deleteStockItemRaw,
} from './datasource';
import { mapStockItemToFrontend, mapStockItemToBackend } from './mapper';

export const stockAdapter = {
  /**
   * Fetch all stock items
   */
  fetchStockItems: async (params?: any) => {
    const raw = await fetchStockItemsRaw(params);
    return Array.isArray(raw) ? raw.map(mapStockItemToFrontend) : [];
  },

  /**
   * Create a new stock item
   */
  createStockItem: async (item: any) => {
    const payload = mapStockItemToBackend(item);
    const raw = await createStockItemRaw(payload);
    return mapStockItemToFrontend(raw);
  },

  /**
   * Update an existing stock item
   */
  updateStockItem: async (id: string, updates: any) => {
    const payload = mapStockItemToBackend(updates);
    const raw = await updateStockItemRaw(id, payload);
    return mapStockItemToFrontend(raw);
  },

  /**
   * Delete a stock item
   */
  deleteStockItem: async (id: string) => {
    await deleteStockItemRaw(id);
  },

  // Methods not available in tunnel-backend yet (keep on Directus)
  fetchStockItemStandardSpecs: undefined,
  createStockItemStandardSpec: undefined,
  updateStockItemStandardSpec: undefined,
  deleteStockItemStandardSpec: undefined,
  fetchStockFamilies: undefined,
  fetchStockSubFamilies: undefined,
  createPurchaseRequest: undefined,
  fetchPurchaseRequests: undefined,
};
