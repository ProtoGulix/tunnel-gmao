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
};
