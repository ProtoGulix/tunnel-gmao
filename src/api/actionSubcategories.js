/**
 * Action Subcategories API
 *
 * @module api/actionSubcategories
 */

import { api } from '@/lib/api/client';

/**
 * Fetch all action subcategories
 * @returns {Promise<Array>} Array of action subcategories
 */
export async function fetchActionSubcategories() {
  const response = await api.get('/items/action_subcategory');
  return response.data?.data || [];
}

/**
 * Fetch single action subcategory by ID
 * @param {string|number} id - Subcategory ID
 * @returns {Promise<Object>} Action subcategory
 */
export async function fetchActionSubcategory(id) {
  const response = await api.get(`/items/action_subcategory/${id}`);
  return response.data?.data || null;
}
