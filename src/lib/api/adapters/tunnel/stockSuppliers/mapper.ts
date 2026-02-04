/**
 * Stock Item Suppliers Mapper - Tunnel Backend
 *
 * Transforms between backend DTOs and frontend domain models.
 *
 * @module lib/api/adapters/tunnel/stockSuppliers/mapper
 */

/**
 * Maps backend stock item supplier to frontend format
 */
export const mapStockItemSupplierToFrontend = (ref: any) => {
  if (!ref) return null;
  
  return {
    id: ref.id,
    stockItemId: ref.stock_item_id,
    stockItemName: ref.stock_item_name,
    stockItemRef: ref.stock_item_ref,
    supplierId: ref.supplier_id,
    supplierName: ref.supplier_name,
    supplierCode: ref.supplier_code,
    supplierRef: ref.supplier_ref,
    unitPrice: ref.unit_price,
    leadTimeDays: ref.lead_time_days,
    minOrderQuantity: ref.min_order_quantity,
    isPreferred: ref.is_preferred,
    manufacturerItemId: ref.manufacturer_item_id,
    createdAt: ref.created_at,
    updatedAt: ref.updated_at,
  };
};

/**
 * Maps frontend stock item supplier to backend format
 */
export const mapStockItemSupplierToBackend = (ref: any) => {
  return {
    stock_item_id: ref.stockItemId,
    supplier_id: ref.supplierId,
    supplier_ref: ref.supplierRef,
    unit_price: ref.unitPrice,
    lead_time_days: ref.leadTimeDays,
    min_order_quantity: ref.minOrderQuantity,
    is_preferred: ref.isPreferred,
    manufacturer_item_id: ref.manufacturerItemId,
  };
};
