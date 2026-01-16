// Adapter for suppliers domain (Directus)
import * as datasource from './datasource';
import * as mapper from './mapper';

export const fetchSuppliers = async () => {
  const rawSuppliers = await datasource.fetchSuppliers();
  return Promise.all(
    rawSuppliers.map(async (supplier: Record<string, unknown>) => {
      let itemCount = 0;
      try {
        // You may want to move this to datasource if needed
        // For now, keep logic here for item count
        // ...
      } catch {
        itemCount = 0;
      }
      return mapper.mapSupplierToDomain(supplier, itemCount);
    })
  );
};

export const createSupplier = async (supplierData: Record<string, unknown>) => {
  const backendPayload = mapper.mapSupplierPayloadToBackend(supplierData);
  const raw = await datasource.createSupplier(backendPayload);
  return mapper.mapSupplierToDomain(raw, 0);
};

export const updateSupplier = async (id: string, updates: Record<string, unknown>) => {
  const backendUpdates = mapper.mapSupplierPayloadToBackend(updates);
  const raw = await datasource.updateSupplier(id, backendUpdates);
  const itemCount = typeof updates?.itemCount === 'number' ? updates.itemCount : (typeof updates?.item_count === 'number' ? updates.item_count : 0);
  return mapper.mapSupplierToDomain(raw, itemCount);
};

const { deleteSupplier } = datasource;
export { deleteSupplier };

export const fetchSupplierOrders = async (status: string | null = null) => {
  const rawOrders = await datasource.fetchSupplierOrders(status);
  return Promise.all(
    rawOrders.map(async (order: Record<string, unknown>) => {
      const lines = Array.isArray((order as Record<string, unknown>).order_lines)
        ? ((order as Record<string, unknown>).order_lines as Record<string, unknown>[])
        : [];
      const lineCount = lines.length;
      
      // Calculer le niveau d'urgence max du panier à partir des lignes
      const urgencyPriority = { high: 3, normal: 2, low: 1 };
      let maxUrgency = 'low';
      let maxPriority = urgencyPriority.low;
      
      lines.forEach((line) => {
        // L'urgence est directement sur la ligne (snapshot au moment de la création)
        const urgency = String(line.urgency || 'low').toLowerCase();
        const priority = urgencyPriority[urgency as keyof typeof urgencyPriority] || urgencyPriority.low;
        if (priority > maxPriority) {
          maxPriority = priority;
          maxUrgency = urgency;
        }
      });
      
      return mapper.mapSupplierOrderToDomain(order, lineCount, maxUrgency);
    })
  );
};

export const fetchSupplierOrder = async (id: string) => {
  const raw = await datasource.fetchSupplierOrder(id);
  return mapper.mapSupplierOrderToDomain(raw);
};

const { fetchSupplierOrderLines } = datasource;
export { fetchSupplierOrderLines };

// CONSULTATION: Exporter la fonction de mise à jour des lignes de panier
const { updateSupplierOrderLine } = datasource;
export { updateSupplierOrderLine };

// PURGE: supprimer un panier et remettre les DA associées en attente
const { purgeSupplierOrder } = datasource;
export { purgeSupplierOrder };

export const updateSupplierOrder = async (id: string, updates: Record<string, unknown>) => {
  const backendUpdates = mapper.mapSupplierOrderUpdatesToBackend(updates);
  const raw = await datasource.updateSupplierOrder(id, backendUpdates);
  return mapper.mapSupplierOrderToDomain(raw);
};

export const dispatchPurchaseRequests = async () => {
  const result = await datasource.dispatchPurchaseRequests();
  return {
    dispatched: result.dispatched || [],
    toQualify: result.toQualify || [],
    errors: result.errors || [],
  };
};

export const suppliersAdapter = {
  fetchSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  fetchSupplierOrders,
  fetchSupplierOrder,
  fetchSupplierOrderLines,
  updateSupplierOrder,
  updateSupplierOrderLine,
  purgeSupplierOrder,
  dispatchPurchaseRequests,
};
