/**
 * Complexity Factors API
 *
 * @module api/complexityFactors
 */

import { api } from '@/lib/api/client';

/**
 * Fetch all complexity factors
 * @returns {Promise<Array>} Array of complexity factors
 */
export async function fetchComplexityFactors() {
  const response = await api.get('/items/complexity_factor');
  return response.data?.data || [];
}

/**
 * Fetch single complexity factor by code
 * @param {string} code - Factor code
 * @returns {Promise<Object>} Complexity factor
 */
export async function fetchComplexityFactor(code) {
  const response = await api.get('/items/complexity_factor', {
    params: {
      filter: { code: { _eq: code } },
      limit: 1,
    },
  });
  return response.data?.data?.[0] || null;
}
