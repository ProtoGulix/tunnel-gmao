/**
 * Action Subcategories Mapper
 *
 * Maps backend responses to domain DTOs defined in API_CONTRACTS.md.
 * Pure transformation functions with no HTTP calls or backend dependencies.
 *
 * @module mapper/actionSubcategories
 */

// ============================================================================
// Response Mappers (Backend → Domain DTOs)
// ============================================================================

/**
 * Maps a backend action_subcategory response to domain ActionSubcategory DTO.
 *
 * @param item - Raw backend subcategory item
 * @returns Domain DTO or null if input is invalid
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mapActionSubcategoryToDomain = (item: any): any => {
  if (!item) return null;

  return {
    id: item.id,
    code: item.code,
    name: item.name,
    category: item.category_id
      ? {
          id: item.category_id.id,
          code: item.category_id.code,
          name: item.category_id.name,
          color: item.category_id.color,
        }
      : undefined,
  };
};

/**
 * Maps a backend action_category response to domain ActionCategory DTO.
 *
 * @param item - Raw backend category item
 * @returns Domain DTO or null if input is invalid
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const mapActionCategoryToDomain = (item: any): any => {
  if (!item) return null;

  return {
    id: item.id,
    code: item.code,
    name: item.name,
    color: item.color,
  };
};
