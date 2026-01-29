/**
 * Complexity Factors Datasource - Tunnel Backend
 *
 * Raw HTTP calls only. Returns unprocessed tunnel-backend responses.
 *
 * @module lib/api/adapters/tunnel/complexityFactors/datasource
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { tunnelApi } from '../client';

/**
 * Fetch all complexity factors (raw API call).
 *
 * @returns Raw backend response (array of complexity factors)
 */
export const fetchComplexityFactorsRaw = async () => {
  const response = await tunnelApi.get('/complexity_factors/');
  const list = Array.isArray(response.data) ? response.data : response.data?.data || [];
  return list || [];
};

/**
 * Fetch a specific complexity factor by code (raw API call).
 *
 * @param code - Complexity factor code (e.g., "AUT", "ORG", etc.)
 * @returns Raw backend response
 */
export const fetchComplexityFactorRaw = async (code: string) => {
  const response = await tunnelApi.get(`/complexity_factors/${code}`);
  return response.data?.data || response.data || {};
};
