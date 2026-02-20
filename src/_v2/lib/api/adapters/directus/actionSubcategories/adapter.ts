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
      const [rawSubcategories, rawCategories] = await Promise.all([
        actionSubcategoriesDatasource.fetchAll(),
        actionSubcategoriesDatasource.fetchCategories(),
      ]);

      const categories = rawCategories.map(mapActionCategoryToDomain);
      const categoryMap = new Map<number, any>(
        categories.map((c: any) => [c.id, c])
      );

      const augmented = rawSubcategories.map((item: any) => ({
        ...item,
        // Enrich with domain category object using FK id
        category_id: categoryMap.get(item.category_id),
      }));

      return augmented.map(mapActionSubcategoryToDomain);
    }, 'FetchActionSubcategories');
  },

  /**
   * Fetch a single action subcategory by ID.
   * @param id - Subcategory ID
   * @returns Domain subcategory DTO
   */
  async fetchActionSubcategory(id: string) {
    return apiCall(async () => {
      const [raw, rawCategories] = await Promise.all([
        actionSubcategoriesDatasource.fetchById(id),
        actionSubcategoriesDatasource.fetchCategories(),
      ]);

      const categories = rawCategories.map(mapActionCategoryToDomain);
      const categoryMap = new Map<number, any>(
        categories.map((c: any) => [c.id, c])
      );

      const augmented = {
        ...raw,
        category_id: categoryMap.get(raw.category_id),
      };

      return mapActionSubcategoryToDomain(augmented);
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
      const rawCategories = await actionSubcategoriesDatasource.fetchCategories();
      const categories = rawCategories.map(mapActionCategoryToDomain);
      const category = categories.find((c: any) => c.code === categoryCode);

      if (!category) return [];

      const rawSubcategories = await actionSubcategoriesDatasource.fetchByCategoryId(category.id);

      const categoryMap = new Map<number, any>(
        categories.map((c: any) => [c.id, c])
      );

      const augmented = rawSubcategories.map((item: any) => ({
        ...item,
        category_id: categoryMap.get(item.category_id),
      }));

      return augmented.map(mapActionSubcategoryToDomain);
    }, 'FetchSubcategoriesByCategory');
  },

  /**
   * Update a category.
   */
  async updateActionCategory(update: { id: number; code?: string; name?: string; color?: string }) {
    return apiCall(async () => {
      const raw = await actionSubcategoriesDatasource.updateCategory(update.id, {
        code: update.code,
        name: update.name,
        color: update.color,
      });
      return mapActionCategoryToDomain(raw);
    }, 'UpdateActionCategory');
  },

  /**
   * Update a subcategory.
   */
  async updateActionSubcategory(update: { id: number; code?: string; name?: string; categoryId?: number }) {
    return apiCall(async () => {
      const raw = await actionSubcategoriesDatasource.updateSubcategory(update.id, {
        code: update.code,
        name: update.name,
        category_id: update.categoryId,
      });

      // Enrich with category for mapper
      const rawCategories = await actionSubcategoriesDatasource.fetchCategories();
      const categories = rawCategories.map(mapActionCategoryToDomain);
      const categoryMap = new Map<number, any>(
        categories.map((c: any) => [c.id, c])
      );

      const augmented = {
        ...raw,
        category_id: categoryMap.get(raw.category_id),
      };

      return mapActionSubcategoryToDomain(augmented);
    }, 'UpdateActionSubcategory');
  },
};
