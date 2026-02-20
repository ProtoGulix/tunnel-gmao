/**
 * Helper functions for StockItemsTable component
 * Extracted to reduce main component complexity
 */

/**
 * Normalize ID from either object or primitive value
 * @param {any} value - The value to normalize (can be object with id property or primitive)
 * @returns {string|null} - Normalized ID or null
 */
export const normalizeId = (value) => {
  if (!value) return null;
  if (typeof value === 'object') return value.id ?? null;
  return value;
};

/**
 * Get supplier references for a specific stock item
 * Handles multiple data structure formats (Array, Map, Object)
 * @param {any} itemId - The stock item ID
 * @param {any} refs - References data (Array, Map, or Object)
 * @returns {Array} - Array of supplier references for the item
 */
export const getItemRefsFromData = (itemId, refs) => {
  const targetId = normalizeId(itemId);
  if (!targetId) return [];

  if (Array.isArray(refs)) {
    return refs.filter((r) => {
      const sid = normalizeId(r.stockItemId ?? r.stock_item_id);
      return sid !== null && String(sid) === String(targetId);
    });
  }

  if (refs instanceof Map) {
    return refs.get(targetId) || [];
  }

  if (refs && typeof refs === 'object') {
    return refs[targetId] || [];
  }

  return [];
};

/**
 * Determine the number of columns needed based on layout
 * @param {boolean} showStockCol - Whether to show the stock column
 * @returns {number} - Number of columns
 */
export const getColSpan = (showStockCol) => (showStockCol ? 7 : 6);

/**
 * Check if an item has preferred supplier reference
 * @param {Array} itemRefs - Array of supplier references for the item
 * @returns {boolean} - True if at least one preferred ref exists
 */
export const hasPreferredRef = (itemRefs) => {
  return Array.isArray(itemRefs) && itemRefs.some((r) => r.isPreferred);
};

/**
 * Determine the badge color for supplier reference count
 * @param {number} count - Number of supplier references
 * @returns {string} - Badge color (blue for >0, amber for 0)
 */
export const getRefCountBadgeColor = (count) => {
  return count > 0 ? 'blue' : 'amber';
};

/**
 * Determine supplier ref badge variant for empty state
 * @param {number} count - Number of supplier references
 * @returns {string} - Badge variant (soft for 0, outline for >0)
 */
export const getRefCountBadgeVariant = (count) => {
  return count === 0 ? 'soft' : 'outline';
};

/**
 * Determine specs badge color
 * @param {number} count - Number of specifications
 * @returns {string} - Badge color (green for >0, gray for 0)
 */
export const getSpecCountBadgeColor = (count) => {
  return count > 0 ? 'green' : 'gray';
};

/**
 * Compare two values for sorting (handles string and numeric comparisons)
 * @param {any} aValue - First value to compare
 * @param {any} bValue - Second value to compare
 * @param {string} direction - Sort direction ('asc' or 'desc')
 * @returns {number} - Comparison result (-1, 0, or 1)
 */
export const compareValues = (aValue, bValue, direction) => {
  const comparison = aValue.toString().localeCompare(bValue.toString(), 'fr', { numeric: true });
  return direction === 'asc' ? comparison : -comparison;
};

/**
 * Get sort values for a specific column
 * @param {Object} item - Stock item object
 * @param {string} column - Column name to sort by
 * @returns {any} - Value to use for sorting
 */
export const getSortValue = (item, column) => {
  switch (column) {
    case 'ref':
      return item.ref || '';
    case 'name':
      return item.name || '';
    case 'family':
      return item.family_code || '';
    case 'stock':
      return item.quantity || 0;
    default:
      return '';
  }
};

/**
 * Sort items by a specific column
 * @param {Array} items - Items to sort
 * @param {string} column - Column name
 * @param {string} direction - Sort direction ('asc' or 'desc')
 * @returns {Array} - Sorted items
 */
export const sortItemsByColumn = (items, column, direction) => {
  if (!column) return items;

  return [...items].sort((a, b) => {
    const aValue = getSortValue(a, column);
    const bValue = getSortValue(b, column);

    // Numeric comparison for stock
    if (column === 'stock') {
      return direction === 'asc' ? aValue - bValue : bValue - aValue;
    }

    // String comparison for other columns
    return compareValues(aValue, bValue, direction);
  });
};
