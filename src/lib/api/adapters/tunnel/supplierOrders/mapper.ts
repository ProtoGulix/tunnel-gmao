/**
 * Supplier Orders Mapper - Tunnel Backend
 *
 * Pure mapping functions. No HTTP calls.
 *
 * @module lib/api/adapters/tunnel/supplierOrders/mapper
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const mapSupplierOrderToDomain = (raw: any) => {
  if (!raw) return null;

  return {
    id: raw.id?.toString() || '',
    orderNumber: raw.order_number || null,
    supplier: raw.supplier ? {
      id: raw.supplier.id || null,
      name: raw.supplier.name || null,
      code: raw.supplier.code || null,
      contact_name: raw.supplier.contact_name || null,
      email: raw.supplier.email || null,
      phone: raw.supplier.phone || null,
    } : null,
    status: raw.status ? raw.status.toLowerCase() : 'open',
    orderedAt: raw.ordered_at || null,
    expectedDeliveryDate: raw.expected_delivery_date || null,
    notes: raw.notes || null,
    currency: raw.currency ? Number(raw.currency) : null,
    totalAmount: raw.total_amount ? Number(raw.total_amount) : null,
    createdAt: raw.created_at || new Date().toISOString(),
    updatedAt: raw.updated_at || null,
    ageDays: raw.age_days ?? null,
    ageColor: raw.age_color ?? null,
    isBlocking: raw.is_blocking ?? null,
    // Include lines if present
    lines: raw.lines ? raw.lines.map(mapSupplierOrderLineToDomain).filter(Boolean) : [],
    lineCount: raw.line_count ?? (raw.lines?.length || 0),
  };
};

export const mapSupplierOrderLineToDomain = (raw: any) => {
  if (!raw) return null;

  return {
    id: raw.id?.toString() || '',
    supplierOrderId: raw.supplier_order_id || null,
    stock_item_id: raw.stock_item_id ? {
      id: raw.stock_item_id.id || raw.stock_item_id,
      name: raw.stock_item_id.name || null,
      ref: raw.stock_item_id.ref || null,
    } : null,
    quantity: Number(raw.quantity ?? 0),
    supplierRefSnapshot: raw.supplier_ref_snapshot || null,
    unitPrice: raw.unit_price ? Number(raw.unit_price) : null,
    totalPrice: raw.total_price ? Number(raw.total_price) : null,
    notes: raw.notes || null,
    quoteReceived: raw.quote_received ?? false,
    isSelected: raw.is_selected ?? false,
    quotePrice: raw.quote_price ? Number(raw.quote_price) : null,
    manufacturer: raw.manufacturer || null,
    manufacturerRef: raw.manufacturer_ref || null,
    quoteReceivedAt: raw.quote_received_at || null,
    rejectedReason: raw.rejected_reason || null,
    leadTimeDays: raw.lead_time_days ? Number(raw.lead_time_days) : null,
    urgency: raw.urgency || 'normal',
    createdAt: raw.created_at || new Date().toISOString(),
    updatedAt: raw.updated_at || null,
    // Purchase requests M2M
    purchaseRequests: raw.purchase_requests || [],
    purchaseRequestUid: raw.purchase_requests?.[0]?.purchase_request_id || null,
    purchaseRequestCount: raw.purchase_request_count ?? (raw.purchase_requests?.length || 0),
  };
};

/**
 * Maps domain supplier order payload to backend format
 */
export const mapSupplierOrderPayloadToBackend = (payload: any): Record<string, unknown> => {
  const backend: Record<string, unknown> = {};

  // Required field
  if (payload.supplierId !== undefined) backend.supplier_id = payload.supplierId;

  // Optional fields
  if (payload.status !== undefined) backend.status = payload.status.toUpperCase();
  if (payload.orderedAt !== undefined) backend.ordered_at = payload.orderedAt;
  if (payload.expectedDeliveryDate !== undefined) backend.expected_delivery_date = payload.expectedDeliveryDate;
  if (payload.notes !== undefined) backend.notes = payload.notes;
  if (payload.currency !== undefined) backend.currency = payload.currency;

  return backend;
};

/**
 * Maps domain supplier order line payload to backend format
 */
export const mapSupplierOrderLinePayloadToBackend = (payload: any): Record<string, unknown> => {
  const backend: Record<string, unknown> = {};

  // Required fields
  if (payload.supplierOrderId !== undefined) backend.supplier_order_id = payload.supplierOrderId;
  if (payload.stockItemId !== undefined) backend.stock_item_id = payload.stockItemId;
  if (payload.stock_item_id !== undefined) backend.stock_item_id = payload.stock_item_id;
  if (payload.quantity !== undefined) backend.quantity = payload.quantity;

  // Optional fields
  if (payload.supplierRefSnapshot !== undefined) backend.supplier_ref_snapshot = payload.supplierRefSnapshot;
  if (payload.unitPrice !== undefined) backend.unit_price = payload.unitPrice;
  if (payload.notes !== undefined) backend.notes = payload.notes;
  if (payload.quoteReceived !== undefined) backend.quote_received = payload.quoteReceived;
  if (payload.isSelected !== undefined) backend.is_selected = payload.isSelected;
  if (payload.quotePrice !== undefined) backend.quote_price = payload.quotePrice;
  if (payload.manufacturer !== undefined) backend.manufacturer = payload.manufacturer;
  if (payload.manufacturerRef !== undefined) backend.manufacturer_ref = payload.manufacturerRef;
  if (payload.quoteReceivedAt !== undefined) backend.quote_received_at = payload.quoteReceivedAt;
  if (payload.rejectedReason !== undefined) backend.rejected_reason = payload.rejectedReason;
  if (payload.leadTimeDays !== undefined) backend.lead_time_days = payload.leadTimeDays;
  if (payload.urgency !== undefined) backend.urgency = payload.urgency;

  // Purchase requests M2M
  if (payload.purchaseRequests !== undefined && Array.isArray(payload.purchaseRequests)) {
    backend.purchase_requests = payload.purchaseRequests.map((pr: any) => ({
      purchase_request_id: pr.purchase_request_id || pr.purchaseRequestId,
      quantity: pr.quantity,
    }));
  }

  return backend;
};
