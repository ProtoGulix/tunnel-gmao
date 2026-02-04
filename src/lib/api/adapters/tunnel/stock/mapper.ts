/**
 * Stock Items Mapper - Tunnel Backend
 *
 * Transforms between backend DTOs and frontend domain models.
 *
 * @module lib/api/adapters/tunnel/stock/mapper
 */

/**
 * Maps backend stock item to frontend format
 */
export const mapStockItemToFrontend = (item: any) => {
  if (!item) return null;
  
  return {
    id: item.id,
    name: item.name,
    familyCode: item.family_code,
    subFamilyCode: item.sub_family_code,
    spec: item.spec,
    dimension: item.dimension,
    ref: item.ref,
    quantity: item.quantity,
    unit: item.unit,
    location: item.location,
    standarsSpec: item.standars_spec,
    manufacturerItemId: item.manufacturer_item_id,
    supplierRefsCount: item.supplier_refs_count,
  };
};

/**
 * Maps frontend stock item to backend format
 */
export const mapStockItemToBackend = (item: any) => {
  return {
    name: item.name,
    family_code: item.familyCode,
    sub_family_code: item.subFamilyCode,
    spec: item.spec,
    dimension: item.dimension,
    quantity: item.quantity,
    unit: item.unit,
    location: item.location,
    standars_spec: item.standarsSpec,
    manufacturer_item_id: item.manufacturerItemId,
  };
};
