/*
 * Stock Mapper (Directus → Domain DTOs)
 * Pure mapping logic. No backend calls, no domain logic, no cache.
 * Use central normalizers if available.
 */

// PurchaseRequest
export const mapPurchaseRequestToDomain = (item: Record<string, unknown>) => {
  if (!item) return null;
  
  // Extraire les données de la relation M2O stock_item_id
  const stockItemRelation = typeof item.stock_item_id === 'object' && item.stock_item_id !== null
    ? item.stock_item_id as Record<string, unknown>
    : null;
  
  // Compter les supplier_refs (c'est un array d'objets {id: "..."} ou null/undefined)
  const supplierCount = Array.isArray(stockItemRelation?.supplier_refs) 
    ? stockItemRelation.supplier_refs.length 
    : 0;
  
  return {
    id: item.id,
    stockItemId: stockItemRelation?.id ?? (typeof item.stock_item_id === 'string' ? item.stock_item_id : undefined),
    stockItemRef: stockItemRelation?.ref ?? undefined,
    stockItemSupplierRefsCount: supplierCount,
    itemLabel: item.item_label ?? undefined,
    quantity: item.quantity ?? undefined,
    unit: item.unit ?? undefined,
    urgency: item.urgency ?? undefined,
    requestedBy: item.requested_by ?? undefined,
    reason: item.reason ?? undefined,
    notes: item.notes ?? undefined,
    status: item.status ?? undefined,
    createdAt: item.created_at ?? undefined,
    interventionId: item.intervention_id ?? undefined,
  };
};

// StockItem
export const mapStockItemToDomain = (item: Record<string, unknown>) => {
  if (!item) return null;
  return {
    id: item.id,
    name: item.name ?? undefined,
    familyCode: item.family_code ?? undefined,
    subFamilyCode: item.sub_family_code ?? undefined,
    spec: item.spec ?? undefined,
    dimension: item.dimension ?? undefined,
    ref: item.ref ?? undefined,
    quantity: item.quantity ?? undefined,
    unit: item.unit ?? undefined,
    location: item.location ?? undefined,
    supplierRefsCount: item.supplier_refs_count ?? 0,
    manufacturerItem:
      typeof item.manufacturer_item_id === 'object' && item.manufacturer_item_id !== null
        ? (() => {
            const mfg = item.manufacturer_item_id as Record<string, unknown>;
            return mfg.id
              ? {
                  id: mfg.id,
                  manufacturerName: mfg.manufacturer_name ?? undefined,
                  manufacturerRef: mfg.manufacturer_ref ?? undefined,
                  designation: mfg.designation ?? undefined,
                }
              : undefined;
          })()
        : item.manufacturer_item_id
        ? { id: item.manufacturer_item_id }
        : undefined,
  };
};

// StockSpec
export const mapStockSpecToDomain = (item: Record<string, unknown>) => {
  if (!item) return null;
  return {
    id: item.id,
    stockItemId:
      typeof item.stock_item_id === 'object' && item.stock_item_id !== null
        ? (item.stock_item_id as Record<string, unknown>).id
        : item.stock_item_id,
    title: item.title ?? undefined,
    text: item.spec_text ?? undefined,
    isDefault: item.is_default || false,
    createdAt: item.created_at ?? undefined,
    updatedAt: item.updated_at ?? undefined,
  };
};

// StockFamily
export const mapStockFamilyToDomain = (item: Record<string, unknown>) => {
  if (!item) return null;
  return {
    code: item.code,
    label: item.label ?? undefined,
  };
};

// StockSubFamily
export const mapStockSubFamilyToDomain = (item: Record<string, unknown>) => {
  if (!item) return null;
  return {
    id: item.id,
    familyCode: item.family_code ?? undefined,
    code: item.code ?? undefined,
    label: item.label ?? undefined,
  };
};

// Domain → Backend mappers
export const mapPurchaseRequestDomainToBackend = (payload: Record<string, unknown>) => {
  const backend: Record<string, unknown> = {};
  
  // Only include stock_item_id if it has a value
  if (payload.stockItemId) backend.stock_item_id = payload.stockItemId;
  if (payload.stock_item_id) backend.stock_item_id = payload.stock_item_id;
  
  // item_label: support both camelCase and snake_case, with item_label taking precedence
  if (payload.item_label !== undefined) backend.item_label = payload.item_label;
  else if (payload.itemLabel !== undefined) backend.item_label = payload.itemLabel;
  
  if (payload.quantity !== undefined) backend.quantity = payload.quantity;
  if (payload.unit !== undefined) backend.unit = payload.unit;
  if (payload.urgency !== undefined) backend.urgency = payload.urgency;
  if (payload.requestedBy !== undefined) backend.requested_by = payload.requestedBy;
  if (payload.requested_by !== undefined) backend.requested_by = payload.requested_by;
  
  if (payload.reason !== undefined) backend.reason = payload.reason;
  if (payload.notes !== undefined) backend.notes = payload.notes;
  if (payload.status !== undefined) backend.status = payload.status;
  
  // Only include intervention_id if it has a truthy value
  // Don't send the field at all if no intervention (null, undefined, etc)
  const interventionId = payload.interventionId ?? payload.intervention_id;
  if (interventionId) {
    backend.intervention_id = interventionId;
  }
  
  return backend;
};

export const mapStockItemDomainToBackend = (payload: Record<string, unknown>) => {
  const backend: Record<string, unknown> = {};
  if (payload.name !== undefined) backend.name = payload.name;
  if (payload.familyCode !== undefined) backend.family_code = payload.familyCode;
  if (payload.family_code !== undefined) backend.family_code = payload.family_code;
  if (payload.subFamilyCode !== undefined) backend.sub_family_code = payload.subFamilyCode;
  if (payload.sub_family_code !== undefined) backend.sub_family_code = payload.sub_family_code;
  if (payload.spec !== undefined) backend.spec = payload.spec;
  if (payload.dimension !== undefined) backend.dimension = payload.dimension;
  if (payload.ref !== undefined) backend.ref = payload.ref;
  if (payload.quantity !== undefined) backend.quantity = payload.quantity;
  if (payload.unit !== undefined) backend.unit = payload.unit;
  if (payload.location !== undefined) backend.location = payload.location;
  // Only include manufacturer_item_id if it has a value
  if (payload.manufacturerItemId) backend.manufacturer_item_id = payload.manufacturerItemId;
  if (payload.manufacturer_item_id) backend.manufacturer_item_id = payload.manufacturer_item_id;
  return backend;
};

export const mapStockSpecDomainToBackend = (payload: Record<string, unknown>) => {
  const backend: Record<string, unknown> = {};
  if (payload.stockItemId !== undefined) backend.stock_item_id = payload.stockItemId;
  if (payload.title !== undefined) backend.title = payload.title;
  if (payload.text !== undefined) backend.spec_text = payload.text;
  if (payload.isDefault !== undefined) backend.is_default = payload.isDefault;
  // Legacy snake_case support
  if (payload.stock_item_id !== undefined) backend.stock_item_id = payload.stock_item_id;
  if (payload.spec_text !== undefined) backend.spec_text = payload.spec_text;
  if (payload.is_default !== undefined) backend.is_default = payload.is_default;
  return backend;
};
