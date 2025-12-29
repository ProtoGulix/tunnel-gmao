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
      let lineCount = 0;
      try {
        // You may want to move this to datasource if needed
        // For now, keep logic here for line count
        // ...
      } catch {
        lineCount = 0;
      }
      return mapper.mapSupplierOrderToDomain(order, lineCount);
    })
  );
};

export const fetchSupplierOrder = async (id: string) => {
  const raw = await datasource.fetchSupplierOrder(id);
  return mapper.mapSupplierOrderToDomain(raw);
};

const { fetchSupplierOrderLines } = datasource;
export { fetchSupplierOrderLines };

export const updateSupplierOrder = async (id: string, updates: Record<string, unknown>) => {
  const backendUpdates = mapper.mapSupplierOrderUpdatesToBackend(updates);
  const raw = await datasource.updateSupplierOrder(id, backendUpdates);
  return mapper.mapSupplierOrderToDomain(raw);
};

// TODO: Implement dispatchPurchaseRequests if needed, using datasource + mappers

export const suppliersAdapter = {
  fetchSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  fetchSupplierOrders,
  fetchSupplierOrder,
  fetchSupplierOrderLines,
  updateSupplierOrder,
};
