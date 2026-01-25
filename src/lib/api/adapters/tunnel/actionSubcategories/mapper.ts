/**
 * Action Subcategories Mapper - Tunnel Backend
 *
 * Pure mapping functions. No HTTP calls.
 *
 * @module lib/api/adapters/tunnel/actionSubcategories/mapper
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const mapSubcategoryToDomain = (raw: any) => {
  if (!raw) return null;

  return {
    id: raw.id?.toString() || '',
    code: raw.code || undefined,
    name: raw.name || '',
  };
};
