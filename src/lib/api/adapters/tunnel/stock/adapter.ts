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
  fetchStockSubFamiliesRaw,
  fetchStockSubFamilyRaw,
  updateStockSubFamilyRaw,
  fetchStockFamiliesRaw,
  fetchStockFamilyRaw,
  createStockSubFamilyRaw,
  deleteStockSubFamilyRaw,
} from './datasource';
import { mapStockItemToFrontend, mapStockItemToBackend, mapStockSubFamilyToFrontend } from './mapper';

export const stockAdapter = {
  /**
   * Fetch all stock items with pagination
   * Returns { items: [...], pagination: {...} }
   */
  fetchStockItems: async (params?: any) => {
    const response = await fetchStockItemsRaw(params);
    
    // Handle both old format (array) and new format (paginated)
    if (Array.isArray(response)) {
      return { items: response.map(mapStockItemToFrontend), pagination: null };
    }
    
    return {
      items: (response.items || []).map(mapStockItemToFrontend),
      pagination: response.pagination || null
    };
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

  /**
   * Fetch stock subfamilies with templates (v1.11.0 - Tunnel Backend)
   */
  fetchStockSubFamilies: async (familyCode?: string) => {
    const raw = await fetchStockSubFamiliesRaw(familyCode);
    return Array.isArray(raw) ? raw.map(mapStockSubFamilyToFrontend) : [];
  },

  /**
   * Fetch a single stock subfamily with template (v1.11.0 - Tunnel Backend)
   */
  fetchStockSubFamily: async (familyCode: string, subFamilyCode: string) => {
    const raw = await fetchStockSubFamilyRaw(familyCode, subFamilyCode);
    return mapStockSubFamilyToFrontend(raw);
  },

  /**
   * Fetch stock families (v2.1.0 - Tunnel Backend) - READ ONLY
   * Returns families with subfamily count
   */
  fetchStockFamilies: async () => {
    const raw = await fetchStockFamiliesRaw();
    // API returns: [{ family_code: "OUT", sub_family_count: 12 }]
    // Map to legacy format: [{ code: "OUT", label: "OUT" }]
    return Array.isArray(raw) ? raw.map((f: any) => ({ 
      code: f.family_code, 
      label: f.family_code // No label in API, use code
    })) : [];
  },

  /**
   * Fetch a single stock family with subfamilies (v2.1.0 - Tunnel Backend)
   * Returns family with complete template information including fields
   */
  fetchStockFamily: async (familyCode: string) => {
    const raw = await fetchStockFamilyRaw(familyCode);
    return {
      code: raw.family_code,
      label: raw.family_code,
      subFamilyCount: raw.sub_family_count,
      // Map sub_families to frontend format with complete template
      subFamilies: (raw.sub_families || []).map((sf: any) => ({
        id: `${raw.family_code}-${sf.code}`, // Composite ID
        familyCode: raw.family_code,
        code: sf.code,
        label: sf.label,
        part_template_id: sf.template?.id || null,
        part_template: sf.template ? {
          id: sf.template.id,
          code: sf.template.code,
          version: sf.template.version,
          label: sf.template.label,
          pattern: sf.template.pattern,
          is_active: sf.template.is_active,
          fields: sf.template.fields || []
        } : null
      }))
    };
  },

  // Stock families are READ ONLY - managed via subfamilies
  createStockFamily: undefined,
  updateStockFamily: undefined,
  deleteStockFamily: undefined,

  /**
   * Update stock subfamily (v1.4.0 - Tunnel Backend)
   */
  updateStockSubFamily: async (familyCode: string, subFamilyCode: string, updates: any) => {
    const raw = await updateStockSubFamilyRaw(familyCode, subFamilyCode, updates);
    return mapStockSubFamilyToFrontend(raw);
  },

  /**
   * Create stock subfamily (v2.1.0 - Tunnel Backend)
   */
  createStockSubFamily: async (subfamilyData: any) => {
    const raw = await createStockSubFamilyRaw(subfamilyData);
    return mapStockSubFamilyToFrontend(raw);
  },

  /**
   * Delete stock subfamily (v2.1.0 - Tunnel Backend)
   */
  deleteStockSubFamily: async (subfamilyId: string) => {
    // This API endpoint requires family_code/sub_family_code, not UUID
    // For now we keep this for compatibility but it should not be used
    throw new Error('deleteStockSubFamily requires family and subfamily codes, not ID');
  },

  // Methods not available in tunnel-backend yet (keep on Directus)
  fetchStockItemStandardSpecs: undefined,
  createStockItemStandardSpec: undefined,
  updateStockItemStandardSpec: undefined,
  deleteStockItemStandardSpec: undefined,
  createPurchaseRequest: undefined,
  fetchPurchaseRequests: undefined,
};
