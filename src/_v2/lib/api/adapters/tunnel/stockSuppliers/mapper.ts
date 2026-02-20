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
    stock_item_id: ref.stock_item_id,
    supplier_id: ref.supplier_id,
    supplier_ref: ref.supplier_ref,
    unit_price: ref.unit_price,
    lead_time_days: ref.lead_time_days,
    min_order_quantity: ref.min_order_quantity,
    is_preferred: ref.is_preferred,
    manufacturer_item_id: ref.manufacturer_item_id,
  };
};
