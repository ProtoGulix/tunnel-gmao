/**
 * Action Subcategories Datasource (Directus)
 *
 * Handles raw HTTP calls to Directus backend for action subcategories and categories.
 * Returns raw backend responses without mapping.
 *
 * @module datasource/actionSubcategories
 */

import { api } from '@/lib/api/client';

// ============================================================================
// Datasource Methods (Backend Calls Only)
// ============================================================================

export const actionSubcategoriesDatasource = {
  /**
   * Fetch all action subcategories from Directus.
   * @returns Raw Directus response data
   */
  async fetchAll() {
    const { data } = await api.get('/items/action_subcategory', {
      params: {
        limit: -1,
        // Avoid nested field access due to permissions; sort client-side later if needed
        sort: 'category_id,code',
        fields: [
          'id',
          // Only request the foreign key; enrich with categories client-side
          'category_id',
          'code',
          'name',
        ].join(','),
        _t: Date.now(),
      },
    });
    return data.data;
  },

  /**
   * Fetch a single action subcategory by ID from Directus.
   * @param id - Subcategory ID
   * @returns Raw Directus response item
   */
  async fetchById(id: string) {
    const { data } = await api.get(`/items/action_subcategory/${id}`, {
      params: {
        fields: [
          'id',
          'category_id',
          'code',
          'name',
        ].join(','),
        _t: Date.now(),
      },
    });
    return data.data;
  },

  /**
   * Fetch all action categories from Directus.
   * @returns Raw Directus response data
   */
  async fetchCategories() {
    const { data } = await api.get('/items/action_category', {
      params: {
        limit: -1,
        sort: 'code',
        fields: ['id', 'code', 'name', 'color'].join(','),
        _t: Date.now(),
      },
    });
    return data.data;
  },

  /**
   * Fetch subcategories by category id from Directus.
   * @param categoryId - Category id
   * @returns Raw Directus response data
   */
  async fetchByCategoryId(categoryId: number) {
    const { data } = await api.get('/items/action_subcategory', {
      params: {
        filter: {
          category_id: { _eq: categoryId },
        },
        limit: -1,
        sort: 'code',
        fields: [
          'id',
          'category_id',
          'code',
          'name',
        ].join(','),
        _t: Date.now(),
      },
    });
    return data.data;
  },

  /**
   * Update an action category in Directus.
   * @param id - Category ID
   * @param payload - Partial update data
   * @returns Raw Directus updated item
   */
  async updateCategory(id: number, payload: { code?: string; name?: string; color?: string }) {
    const { data } = await api.patch(`/items/action_category/${id}`, payload);
    return data.data;
  },

  /**
   * Update an action subcategory in Directus.
   * @param id - Subcategory ID
   * @param payload - Partial update data
   * @returns Raw Directus updated item
   */
  async updateSubcategory(id: number, payload: { code?: string; name?: string; category_id?: number }) {
    const { data } = await api.patch(`/items/action_subcategory/${id}`, payload);
    return data.data;
  },
};
