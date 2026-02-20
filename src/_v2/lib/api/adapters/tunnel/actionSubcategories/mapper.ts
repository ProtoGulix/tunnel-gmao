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
    category: raw.category_id
      ? {
          id: raw.category_id.id ?? raw.category_id,
          code: raw.category_id.code,
          name: raw.category_id.name,
          color: raw.category_id.color,
        }
      : undefined,
  };
};

export const mapCategoryToDomain = (raw: any) => {
  if (!raw) return null;

  return {
    id: raw.id?.toString?.() || raw.id,
    code: raw.code || undefined,
    name: raw.name || '',
    color: raw.color || undefined,
  };
};
