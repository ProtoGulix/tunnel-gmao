/**
 * Action Categories API
 *
 * @module api/actionCategories
 */

import { api } from '@/lib/api/client';

/**
 * Fetch all action categories with their subcategories
 * @returns {Promise<Array>} Array of categories with nested subcategories
 */
export async function fetchActionCategories() {
  const response = await api.get('/action-categories');
  return response.data || [];
}

/**
 * Fetch single action category by ID
 * @param {string|number} id - Category ID
 * @returns {Promise<Object>} Action category
 */
export async function fetchActionCategory(id) {
  const response = await api.get(`/action-categories${id}`);
  return response.data || null;
}

/**
 * Fetch subcategories for a specific category
 * @param {string|number} categoryId - Category ID
 * @returns {Promise<Array>} Array of subcategories
 */
export async function fetchCategorySubcategories(categoryId) {
  const response = await api.get(`/action-categories/${categoryId}/subcategories`);
  return response.data || [];
}
