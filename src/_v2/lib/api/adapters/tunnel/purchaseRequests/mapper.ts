/**
 * Purchase Requests Mapper - Tunnel Backend
 *
 * Pure mapping functions. No HTTP calls.
 *
 * @module lib/api/adapters/tunnel/purchaseRequests/mapper
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export const mapPurchaseRequestToDomain = (raw: any) => {
  if (!raw) return null;

  const orderLines =
    raw.order_lines ||
    raw.orderLines ||
    raw.supplier_order_lines ||
    raw.supplierOrderLines ||
    raw.supplier_order_line_ids ||
    raw.supplierOrderLineIds ||
    [];

  return {
    id: raw.id?.toString() || '',
    itemLabel: raw.item_label || '',
    quantity: Number(raw.quantity ?? 0),
    stockItemId: raw.stock_item_id || null,
    unit: raw.unit || null,
    requestedBy: raw.requested_by || null,
    urgency: raw.urgency || 'normal',
    reason: raw.reason || null,
    notes: raw.notes || null,
    workshop: raw.workshop || null,
    interventionId: raw.intervention_id?.id || raw.intervention_id || null,
    intervention: raw.intervention_id && typeof raw.intervention_id === 'object' ? {
      id: raw.intervention_id.id,
      code: raw.intervention_id.code || raw.intervention_id.id,
    } : null,
    quantityRequested: raw.quantity_requested ? Number(raw.quantity_requested) : null,
    quantityApproved: raw.quantity_approved ? Number(raw.quantity_approved) : null,
    urgent: raw.urgent ?? false,
    requesterName: raw.requester_name || null,
    approverName: raw.approver_name || null,
    approvedAt: raw.approved_at || null,
    createdAt: raw.created_at || new Date().toISOString(),
    updatedAt: raw.updated_at || null,
    // Champs calculés/dérivés
    status: raw.status || null,
    derived_status: raw.derived_status || null,
    stockItemSupplierRefsCount: raw.stock_item_supplier_refs_count ?? 0,
    orderLines,
  };
};

/**
 * Maps domain purchase request payload to backend format
 */
export const mapPurchaseRequestPayloadToBackend = (payload: any): Record<string, unknown> => {
  const backend: Record<string, unknown> = {};

  // Required fields
  if (payload.itemLabel !== undefined) backend.item_label = payload.itemLabel;
  if (payload.quantity !== undefined) backend.quantity = payload.quantity;

  // Optional fields
  if (payload.stockItemId !== undefined) backend.stock_item_id = payload.stockItemId;
  if (payload.unit !== undefined) backend.unit = payload.unit;
  if (payload.requestedBy !== undefined) backend.requested_by = payload.requestedBy;
  if (payload.urgency !== undefined) backend.urgency = payload.urgency;
  if (payload.reason !== undefined) backend.reason = payload.reason;
  if (payload.notes !== undefined) backend.notes = payload.notes;
  if (payload.workshop !== undefined) backend.workshop = payload.workshop;
  if (payload.interventionId !== undefined) backend.intervention_id = payload.interventionId;
  if (payload.quantityRequested !== undefined) backend.quantity_requested = payload.quantityRequested;
  if (payload.quantityApproved !== undefined) backend.quantity_approved = payload.quantityApproved;
  if (payload.urgent !== undefined) backend.urgent = payload.urgent;
  if (payload.requesterName !== undefined) backend.requester_name = payload.requesterName;
  if (payload.approverName !== undefined) backend.approver_name = payload.approverName;
  if (payload.approvedAt !== undefined) backend.approved_at = payload.approvedAt;

  return backend;
};
