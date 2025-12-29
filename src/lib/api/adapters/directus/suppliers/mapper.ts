// Mapper functions for suppliers domain

export const normalizeSupplierOrderStatus = (raw: unknown): string => {
  if (!raw) return 'open';
  if (typeof raw === 'string') return String(raw).toLowerCase();
  const obj = raw as Record<string, unknown>;
  const value = obj.value ?? obj.status ?? raw;
  return String(value).toLowerCase();
};

export const mapSupplierToDomain = (item: Record<string, unknown> | null, itemCount = 0) => {
  if (!item) return null;
  return {
    id: item.id,
    name: item.name ?? undefined,
    contactName: item.contact_name ?? undefined,
    email: item.email ?? undefined,
    phone: item.phone ?? undefined,
    isActive: item.is_active ?? undefined,
    itemCount,
  };
};

export const mapSupplierOrderToDomain = (order: Record<string, unknown> | null, lineCount = 0) => {
  if (!order) return null;
  const supplier = order.supplier_id as Record<string, unknown> | undefined;
  return {
    id: order.id,
    orderNumber: order.order_number ?? undefined,
    supplier: supplier
      ? {
          id: supplier.id ?? supplier,
          name: supplier.name ?? undefined,
          email: supplier.email ?? undefined,
          contactName: supplier.contact_name ?? undefined,
        }
      : undefined,
    status: normalizeSupplierOrderStatus(order.status),
    totalAmount: order.total_amount ?? undefined,
    createdAt: order.created_at ?? undefined,
    orderedAt: order.ordered_at ?? undefined,
    receivedAt: order.received_at ?? undefined,
    lineCount,
  };
};

export const mapManufacturerFromLine = (raw: unknown) => {
  if (!raw) return undefined;
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>;
    if (obj.id) {
      return {
        id: obj.id,
        manufacturerName: obj.manufacturer_name ?? undefined,
        manufacturerRef: obj.manufacturer_ref ?? undefined,
        designation: obj.designation ?? undefined,
      };
    }
  }
  return { id: raw };
};

export const mapLineStockItemToDomain = (lineStockItem: Record<string, unknown> | null | undefined) => {
  if (!lineStockItem) return undefined;
  return {
    id: lineStockItem.id,
    ref: lineStockItem.ref ?? undefined,
    name: lineStockItem.name ?? undefined,
    familyCode: lineStockItem.family_code ?? undefined,
    subFamilyCode: lineStockItem.sub_family_code ?? undefined,
    dimension: lineStockItem.dimension ?? undefined,
    location: lineStockItem.location ?? undefined,
    unit: lineStockItem.unit ?? undefined,
    manufacturerItem: mapManufacturerFromLine(lineStockItem.manufacturer_item_id),
  };
};

export const mapPurchaseRequestJunctionToDomain = (junction: Record<string, unknown> | null) => {
  if (!junction) return null;
  const pr = junction.purchase_request_id as Record<string, unknown> | undefined;
  const qty = junction.quantity;
  const intervention = pr?.intervention_id as Record<string, unknown> | undefined;
  return {
    id: (typeof pr === 'object' && pr !== null ? pr.id : pr) ?? junction.id,
    requestedBy: pr?.requested_by ?? undefined,
    itemLabel: pr?.item_label ?? undefined,
    intervention: intervention
      ? {
          id: intervention.id ?? intervention,
          code: intervention.code ?? undefined,
        }
      : undefined,
    quantity: qty !== undefined && qty !== null ? Number(qty) : undefined,
  };
};

export const mapSupplierPayloadToBackend = (payload: Record<string, unknown>) => {
  const backend: Record<string, unknown> = {};
  if (payload.name !== undefined) backend.name = payload.name;
  if (payload.contactName !== undefined) backend.contact_name = payload.contactName;
  if (payload.email !== undefined) backend.email = payload.email;
  if (payload.phone !== undefined) backend.phone = payload.phone;
  if (payload.isActive !== undefined) backend.is_active = payload.isActive;
  return backend;
};

export const mapSupplierOrderUpdatesToBackend = (payload: Record<string, unknown>) => {
  const backend: Record<string, unknown> = {};
  if (payload.status !== undefined) backend.status = String(payload.status).toUpperCase();
  if (payload.totalAmount !== undefined) backend.total_amount = payload.totalAmount;
  if (payload.orderedAt !== undefined) backend.ordered_at = payload.orderedAt;
  if (payload.receivedAt !== undefined) backend.received_at = payload.receivedAt;
  return backend;
};
