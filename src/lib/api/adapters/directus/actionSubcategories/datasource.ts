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
        sort: 'category_id.code,code',
        fields: [
          'id',
          'category_id.id',
          'category_id.code',
          'category_id.name',
          'category_id.color',
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
          'category_id.id',
          'category_id.code',
          'category_id.name',
          'category_id.color',
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
   * Fetch subcategories by category code from Directus.
   * @param categoryCode - Category code (e.g., 'DEP', 'COR')
   * @returns Raw Directus response data
   */
  async fetchByCategory(categoryCode: string) {
    const { data } = await api.get('/items/action_subcategory', {
      params: {
        filter: {
          'category_id.code': { _eq: categoryCode },
        },
        limit: -1,
        sort: 'code',
        fields: [
          'id',
          'category_id.id',
          'category_id.code',
          'category_id.name',
          'category_id.color',
          'code',
          'name',
        ].join(','),
        _t: Date.now(),
      },
    });
    return data.data;
  },
};
