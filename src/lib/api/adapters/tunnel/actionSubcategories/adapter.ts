/**
 * Action Subcategories Adapter - Tunnel Backend
 *
 * Backend-agnostic domain interface. Orchestrates datasource + mapper.
 *
 * @module lib/api/adapters/tunnel/actionSubcategories/adapter
 */

import { apiCall } from '@/lib/api/errors';
import * as datasource from './datasource';
import * as mapper from './mapper';

export const actionSubcategoriesAdapter = {
  async fetchSubcategories() {
    return apiCall(async () => {
      const raw = await datasource.fetchSubcategoriesRaw();
      return raw.map(mapper.mapSubcategoryToDomain).filter(Boolean);
    }, 'TunnelActionSubcategories.fetchSubcategories');
  },

  async fetchActionSubcategories() {
    return apiCall(async () => {
      const [rawSubcategories, rawCategories] = await Promise.all([
        datasource.fetchSubcategoriesRaw(),
        datasource.fetchCategoriesRaw(),
      ]);

      const categories = rawCategories.map(mapper.mapCategoryToDomain).filter(Boolean);
      const categoryMap = new Map(
        categories.map((c: any) => [String(c.id), c])
      );

      const augmented = rawSubcategories.map((item: any) => ({
        ...item,
        category_id: categoryMap.get(String(item.category_id)) || item.category_id,
      }));

      return augmented.map(mapper.mapSubcategoryToDomain).filter(Boolean);
    }, 'TunnelActionSubcategories.fetchActionSubcategories');
  },

  async fetchActionCategories() {
    return apiCall(async () => {
      const raw = await datasource.fetchCategoriesRaw();
      return raw.map(mapper.mapCategoryToDomain).filter(Boolean);
    }, 'TunnelActionSubcategories.fetchActionCategories');
  },
};
