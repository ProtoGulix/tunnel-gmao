// Mapper functions for stock specs domain

/**
 * Maps a Directus stock spec to domain StockItemStandardSpec DTO.
 */
export const mapStockSpecToDomain = (item: Record<string, unknown> | null) => {
  if (!item) return null;
  
  const stockItemId = item.stock_item_id;
  const stockItemObj = typeof stockItemId === 'object' && stockItemId !== null 
    ? stockItemId as Record<string, unknown> 
    : null;

  return {
    id: item.id,
    stockItemId: stockItemObj?.id ?? stockItemId,
    title: item.title ?? undefined,
    text: item.spec_text ?? undefined,
    isDefault: item.is_default || false,
    createdAt: item.created_at ?? undefined,
    // Relations nested (optional)
    stockItem:
      stockItemObj?.id
        ? {
            id: stockItemObj.id,
            name: stockItemObj.name ?? undefined,
            ref: stockItemObj.ref ?? undefined,
          }
        : undefined,
  };
};

/**
 * Maps domain StockItemStandardSpec payload to Directus format.
 */
export const mapStockSpecDomainToBackend = (payload: Record<string, unknown>) => {
  const backend: Record<string, unknown> = {};
  if (payload.stockItemId !== undefined) backend.stock_item_id = payload.stockItemId;
  if (payload.title !== undefined) backend.title = payload.title;
  if (payload.text !== undefined) backend.spec_text = payload.text;
  if (payload.isDefault !== undefined) backend.is_default = payload.isDefault;
  return backend;
};
