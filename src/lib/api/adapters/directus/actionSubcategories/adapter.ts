/**
 * Action Subcategories Adapter
 *
 * Domain interface for action subcategories and categories.
 * Orchestrates datasource calls and response mapping.
 * Backend-agnostic - uses only domain types from API_CONTRACTS.md.
 *
 * @module adapter/actionSubcategories
 */

import { apiCall } from '@/lib/api/errors';
import { actionSubcategoriesDatasource } from './datasource';
import { mapActionSubcategoryToDomain, mapActionCategoryToDomain } from './mapper';

// ============================================================================
// Adapter Methods (Domain Interface)
// ============================================================================

export const actionSubcategoriesAdapter = {
  /**
   * Fetch all action subcategories with their categories.
   * @returns Array of domain subcategory DTOs
   */
  async fetchActionSubcategories() {
    return apiCall(async () => {
      const raw = await actionSubcategoriesDatasource.fetchAll();
      return raw.map(mapActionSubcategoryToDomain);
    }, 'FetchActionSubcategories');
  },

  /**
   * Fetch a single action subcategory by ID.
   * @param id - Subcategory ID
   * @returns Domain subcategory DTO
   */
  async fetchActionSubcategory(id: string) {
    return apiCall(async () => {
      const raw = await actionSubcategoriesDatasource.fetchById(id);
      return mapActionSubcategoryToDomain(raw);
    }, 'FetchActionSubcategory');
  },

  /**
   * Fetch all action categories.
   * @returns Array of domain category DTOs
   */
  async fetchActionCategories() {
    return apiCall(async () => {
      const raw = await actionSubcategoriesDatasource.fetchCategories();
      return raw.map(mapActionCategoryToDomain);
    }, 'FetchActionCategories');
  },

  /**
   * Fetch subcategories by category code.
   * @param categoryCode - Category code (e.g., 'DEP', 'COR')
   * @returns Array of domain subcategory DTOs
   */
  async fetchSubcategoriesByCategory(categoryCode: string) {
    return apiCall(async () => {
      const raw = await actionSubcategoriesDatasource.fetchByCategory(categoryCode);
      return raw.map(mapActionSubcategoryToDomain);
    }, 'FetchSubcategoriesByCategory');
  },
};
