/**
 * Action Subcategories Adapter (Directus)
 *
 * Maps Directus-specific responses to domain DTOs defined in API_CONTRACTS.md:
 * - ActionSubcategory
 * - ActionCategory
 *
 * Handles:
 * - Directus field name mappings
 * - Directus-specific filters and query parameters
 * - Response normalization to domain shapes
 * - Cache invalidation
 */

import { api } from '@/lib/api/client';
import { apiCall } from '@/lib/api/errors';

// ============================================================================
// Response Mappers (Directus → Domain)
// ============================================================================

/**
 * Maps a Directus action_subcategory response to domain ActionSubcategory DTO.
 */
const mapActionSubcategoryToDomain = (item) => {
  if (!item) return null;

  return {
    id: item.id,
    code: item.code,
    name: item.name,
    category: item.category_id
      ? {
          id: item.category_id.id,
          code: item.category_id.code,
          name: item.category_id.name,
        }
      : undefined,
  };
};

/**
 * Maps a Directus action_category response to domain ActionCategory DTO.
 */
const mapActionCategoryToDomain = (item) => {
  if (!item) return null;

  return {
    id: item.id,
    code: item.code,
    name: item.name,
  };
};

// ============================================================================
// API Methods (Domain interface)
// ============================================================================

export const actionSubcategoriesAdapter = {
  /**
   * Fetch all action subcategories with their categories.
   * @returns {Promise<ActionSubcategory[]>}
   */
  fetchActionSubcategories: async () => {
    return apiCall(async () => {
      const { data } = await api.get('/items/action_subcategory', {
        params: {
          limit: -1,
          sort: 'category_id.code,code',
          fields: [
            'id',
            'category_id.id',
            'category_id.code',
            'category_id.name',
            'code',
            'name',
          ].join(','),
          _t: Date.now(),
        },
      });
      return data.data.map(mapActionSubcategoryToDomain);
    }, 'FetchActionSubcategories');
  },

  /**
   * Fetch a single action subcategory by ID.
   * @param {string} id - Subcategory ID
   * @returns {Promise<ActionSubcategory>}
   */
  fetchActionSubcategory: async (id) => {
    return apiCall(async () => {
      const { data } = await api.get(`/items/action_subcategory/${id}`, {
        params: {
          fields: [
            'id',
            'category_id.id',
            'category_id.code',
            'category_id.name',
            'code',
            'name',
          ].join(','),
          _t: Date.now(),
        },
      });
      return mapActionSubcategoryToDomain(data.data);
    }, 'FetchActionSubcategory');
  },

  /**
   * Fetch all action categories.
   * @returns {Promise<ActionCategory[]>}
   */
  fetchActionCategories: async () => {
    return apiCall(async () => {
      const { data } = await api.get('/items/action_category', {
        params: {
          limit: -1,
          sort: 'code',
          fields: ['id', 'code', 'name'].join(','),
          _t: Date.now(),
        },
      });
      return data.data.map(mapActionCategoryToDomain);
    }, 'FetchActionCategories');
  },

  /**
   * Fetch subcategories by category code.
   * @param {string} categoryCode - Category code (e.g., 'DEP', 'COR')
   * @returns {Promise<ActionSubcategory[]>}
   */
  fetchSubcategoriesByCategory: async (categoryCode) => {
    return apiCall(async () => {
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
            'code',
            'name',
          ].join(','),
          _t: Date.now(),
        },
      });
      return data.data.map(mapActionSubcategoryToDomain);
    }, 'FetchSubcategoriesByCategory');
  },
};
