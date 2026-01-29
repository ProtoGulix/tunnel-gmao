/**
 * Complexity Factors Mapper - Tunnel Backend
 *
 * Pure mapping functions. No HTTP calls.
 *
 * @module lib/api/adapters/tunnel/complexityFactors/mapper
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Maps raw backend complexity factor to domain DTO.
 *
 * Backend format (from API manifest):
 * {
 *   "code": "string",
 *   "label": "string|null",
 *   "category": "string|null"
 * }
 *
 * Domain format:
 * {
 *   "id": "string",  // code is used as id
 *   "code": "string",
 *   "label": "string",
 *   "category": "string"
 * }
 *
 * @param raw - Raw backend complexity factor object
 * @returns Domain ComplexityFactor DTO
 */
export const mapComplexityFactorToDomain = (raw: any) => {
  if (!raw) return null;

  return {
    id: raw.code || '',
    code: raw.code || '',
    label: raw.label || '',
    category: raw.category || '',
  };
};
