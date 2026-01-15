// Mapper functions for stock-supplier links domain

/**
 * Maps a Directus stock-supplier link to domain StockItemSupplierLink DTO.
 */
export const mapStockSupplierLinkToDomain = (item: Record<string, unknown> | null) => {
  if (!item) return null;

  const stockItemId = item.stock_item_id;
  const stockItemObj = typeof stockItemId === 'object' && stockItemId !== null
    ? stockItemId as Record<string, unknown>
    : null;

  const supplierId = item.supplier_id;
  const supplierObj = typeof supplierId === 'object' && supplierId !== null
    ? supplierId as Record<string, unknown>
    : null;

  const manufacturerItemId = item.manufacturer_item_id;
  const manufacturerObj = typeof manufacturerItemId === 'object' && manufacturerItemId !== null
    ? manufacturerItemId as Record<string, unknown>
    : null;

  // Debug: Log pour voir ce qui arrive de l'API
  if (process.env.NODE_ENV === 'development') {
    console.log('[Mapper] manufacturer_item_id brut:', manufacturerItemId);
    console.log('[Mapper] manufacturerObj après cast:', manufacturerObj);
  }

  return {
    id: item.id,
    stockItemId: stockItemObj?.id ?? stockItemId,
    supplier: supplierObj
      ? {
          id: supplierObj.id,
          name: supplierObj.name ?? undefined,
        }
      : supplierId
      ? { id: supplierId }
      : undefined,
    supplierRef: item.supplier_ref ?? undefined,
    isPreferred: item.is_preferred || false,
    unitPrice: item.unit_price ?? undefined,
    deliveryTimeDays: item.delivery_time_days ?? undefined,
    // Manufacturer relation (optional)
    manufacturerItem: manufacturerObj?.id
      ? {
          id: manufacturerObj.id,
          manufacturerName: manufacturerObj.manufacturer_name ?? undefined,
          manufacturerRef: manufacturerObj.manufacturer_ref ?? undefined,
          designation: manufacturerObj.designation ?? undefined,
        }
      : undefined,
    // Stock item relation (for supplier panel)
    stockItem: stockItemObj?.id
      ? {
          id: stockItemObj.id,
          ref: stockItemObj.ref ?? undefined,
          name: stockItemObj.name ?? undefined,
        }
      : undefined,
  };
};

/**
 * Maps domain StockItemSupplierLink payload to Directus format.
 */
export const mapStockSupplierLinkDomainToBackend = (payload: Record<string, unknown>) => {
  const backend: Record<string, unknown> = {};

  // Domain field names (camelCase)
  if (payload.stockItemId !== undefined) backend.stock_item_id = payload.stockItemId;
  if (payload.supplierId !== undefined) backend.supplier_id = payload.supplierId;
  if (payload.supplierRef !== undefined) backend.supplier_ref = payload.supplierRef;
  if (payload.unitPrice !== undefined) backend.unit_price = payload.unitPrice ?? null;
  if (payload.deliveryTimeDays !== undefined)
    backend.delivery_time_days = payload.deliveryTimeDays ?? null;
  if (payload.isPreferred !== undefined) backend.is_preferred = payload.isPreferred ?? false;
  if (payload.manufacturerItemId !== undefined)
    backend.manufacturer_item_id = payload.manufacturerItemId;

  // Support legacy field names (snake_case) for backwards compatibility
  if (payload.stock_item_id !== undefined) backend.stock_item_id = payload.stock_item_id;
  if (payload.supplier_id !== undefined) backend.supplier_id = payload.supplier_id;
  if (payload.supplier_ref !== undefined) backend.supplier_ref = payload.supplier_ref;
  if (payload.unit_price !== undefined) backend.unit_price = payload.unit_price ?? null;
  if (payload.delivery_time_days !== undefined)
    backend.delivery_time_days = payload.delivery_time_days ?? null;
  if (payload.is_preferred !== undefined) backend.is_preferred = payload.is_preferred ?? false;
  if (payload.manufacturer_item_id !== undefined)
    backend.manufacturer_item_id = payload.manufacturer_item_id;

  return backend;
};
