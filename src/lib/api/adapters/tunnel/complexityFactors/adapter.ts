/**
 * Complexity Factors Adapter - Tunnel Backend
 *
 * Backend-agnostic domain interface. Orchestrates datasource + mapper.
 *
 * @module lib/api/adapters/tunnel/complexityFactors/adapter
 */

import { apiCall } from '@/lib/api/errors';
import * as datasource from './datasource';
import * as mapper from './mapper';

export const complexityFactorsAdapter = {
  /**
   * Fetch all complexity factors.
   *
   * @returns Array of ComplexityFactor DTOs
   */
  async fetchComplexityFactors() {
    return apiCall(async () => {
      const raw = await datasource.fetchComplexityFactorsRaw();
      return raw.map(mapper.mapComplexityFactorToDomain).filter(Boolean);
    }, 'TunnelComplexityFactors.fetchComplexityFactors');
  },

  /**
   * Fetch a specific complexity factor by code.
   *
   * @param code - Complexity factor code
   * @returns ComplexityFactor DTO
   */
  async fetchComplexityFactor(code: string) {
    return apiCall(async () => {
      const raw = await datasource.fetchComplexityFactorRaw(code);
      return mapper.mapComplexityFactorToDomain(raw);
    }, `TunnelComplexityFactors.fetchComplexityFactor:${code}`);
  },
};
