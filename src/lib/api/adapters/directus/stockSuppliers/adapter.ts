// Adapter for stock-supplier links domain (Directus)
import * as datasource from './datasource';
import * as mapper from './mapper';

export const fetchStockItemSuppliers = async (stockItemId: string) => {
  const rawLinks = await datasource.fetchStockItemSuppliers(stockItemId);
  return rawLinks.map((link: Record<string, unknown>) => mapper.mapStockSupplierLinkToDomain(link));
};

export const fetchSupplierRefsBySupplier = async (supplierId: string) => {
  const rawLinks = await datasource.fetchSupplierRefsBySupplier(supplierId);
  return rawLinks.map((link: Record<string, unknown>) => mapper.mapStockSupplierLinkToDomain(link));
};

export const createStockItemSupplier = async (linkData: Record<string, unknown>) => {
  // Normalize payload
  const backendPayload = mapper.mapStockSupplierLinkDomainToBackend(linkData);

  // Validate supplier_ref - but be lenient on empty strings
  const supplierRef = backendPayload.supplier_ref;

  if (supplierRef === undefined || supplierRef === null) {
    console.error('[API] ERROR: supplier_ref is undefined or null');
    throw new Error('supplier_ref is required');
  }

  if (typeof supplierRef !== 'string') {
    console.error("[API] ERROR: supplier_ref is not a string, it's a", typeof supplierRef);
    throw new Error(`supplier_ref must be a string, got ${typeof supplierRef}`);
  }

  const trimmedRef = supplierRef.trim();
  if (!trimmedRef) {
    console.error('[API] ERROR: supplier_ref is empty after trim:', {
      original: supplierRef,
      trimmed: trimmedRef,
    });
    throw new Error('supplier_ref cannot be empty');
  }

  // Apply trimmed ref
  backendPayload.supplier_ref = trimmedRef;

  const rawData = await datasource.createStockItemSupplier(backendPayload);
  return mapper.mapStockSupplierLinkToDomain(rawData);
};

export const updateStockItemSupplier = async (id: string, updates: Record<string, unknown>) => {
  const backendUpdates = mapper.mapStockSupplierLinkDomainToBackend(updates);
  const rawData = await datasource.updateStockItemSupplier(id, backendUpdates);
  return mapper.mapStockSupplierLinkToDomain(rawData);
};

export const setPreferredSupplier = async (stockItemId: string, linkId: string) => {
  // 1. Fetch all links for this stock item
  const links = await fetchStockItemSuppliers(stockItemId);

  // 2. Update all links (only one will be preferred)
  const updates = links.map((link) => {
    const isPreferred = link.id === linkId;
    return updateStockItemSupplier(link.id as string, { isPreferred });
  });

  await Promise.all(updates);
  return true;
};

const { deleteStockItemSupplier } = datasource;
export { deleteStockItemSupplier };

export const stockSuppliersAdapter = {
  fetchStockItemSuppliers,
  fetchSupplierRefsBySupplier,
  createStockItemSupplier,
  updateStockItemSupplier,
  setPreferredSupplier,
  deleteStockItemSupplier,
};
