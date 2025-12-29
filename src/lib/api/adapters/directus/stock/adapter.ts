/*
 * Stock Adapter (Directus)
 * Orchestrates datasource and mapper. No backend fields, no HTTP, no filters.
 * Exposes the domain API as per API_CONTRACTS.md.
 */

import {
  fetchPurchaseRequestsFromBackend,
  fetchPurchaseRequestsByInterventionFromBackend,
  createPurchaseRequestInBackend,
  updatePurchaseRequestInBackend,
  fetchStockItemsFromBackend,
  createStockItemInBackend,
  updateStockItemInBackend,
  deleteStockItemInBackend,
  fetchStockItemStandardSpecsFromBackend,
  createStockItemStandardSpecInBackend,
  updateStockItemStandardSpecInBackend,
  deleteStockItemStandardSpecInBackend,
  fetchStockFamiliesFromBackend,
  fetchStockSubFamiliesFromBackend,
} from './datasource';
import {
  mapPurchaseRequestToDomain,
  mapStockItemToDomain,
  mapStockSpecToDomain,
  mapStockFamilyToDomain,
  mapStockSubFamilyToDomain,
  mapPurchaseRequestDomainToBackend,
  mapStockItemDomainToBackend,
  mapStockSpecDomainToBackend,
} from './mapper';
import { invalidateCache } from '@/lib/api/client';

// Purchase Requests
export const fetchPurchaseRequests = async () => {
  const items = await fetchPurchaseRequestsFromBackend();
  return items.map(mapPurchaseRequestToDomain);
};

export const fetchPurchaseRequestsByIntervention = async (interventionId: string) => {
  const items = await fetchPurchaseRequestsByInterventionFromBackend(interventionId);
  return items.map(mapPurchaseRequestToDomain);
};

export const createPurchaseRequest = async (requestData: Record<string, unknown>) => {
  const backendPayload = mapPurchaseRequestDomainToBackend(requestData);
  if (backendPayload.status === undefined) backendPayload.status = 'open';
  const created = await createPurchaseRequestInBackend(backendPayload);
  invalidateCache('purchaseRequests');
  return mapPurchaseRequestToDomain(created);
};

export const updatePurchaseRequest = async (id: string, updates: Record<string, unknown>) => {
  const backendUpdates = mapPurchaseRequestDomainToBackend(updates);
  const updated = await updatePurchaseRequestInBackend(id, backendUpdates);
  invalidateCache('purchaseRequests');
  invalidateCache('stockItems');
  return mapPurchaseRequestToDomain(updated);
};

// Stock Items
export const fetchStockItems = async () => {
  const items = await fetchStockItemsFromBackend();
  return items.map(mapStockItemToDomain);
};

export const createStockItem = async (itemData: Record<string, unknown>) => {
  const backendPayload = mapStockItemDomainToBackend(itemData);
  const created = await createStockItemInBackend(backendPayload);
  invalidateCache('stockItems');
  return mapStockItemToDomain(created);
};

export const updateStockItem = async (id: string, updates: Record<string, unknown>) => {
  const backendUpdates = mapStockItemDomainToBackend(updates);
  const updated = await updateStockItemInBackend(id, backendUpdates);
  invalidateCache('stockItems');
  return mapStockItemToDomain(updated);
};

export const deleteStockItem = async (id: string) => {
  await deleteStockItemInBackend(id);
  invalidateCache('stockItems');
  return true;
};

// Stock Item Standard Specs
export const fetchStockItemStandardSpecs = async (stockItemId: string) => {
  const items = await fetchStockItemStandardSpecsFromBackend(stockItemId);
  return items.map(mapStockSpecToDomain);
};

export const createStockItemStandardSpec = async (specData: Record<string, unknown>) => {
  const backendPayload = mapStockSpecDomainToBackend(specData);
  const created = await createStockItemStandardSpecInBackend(backendPayload);
  invalidateCache('stockSpecs');
  return mapStockSpecToDomain(created);
};

export const updateStockItemStandardSpec = async (id: string, updates: Record<string, unknown>) => {
  const backendUpdates = mapStockSpecDomainToBackend(updates);
  const updated = await updateStockItemStandardSpecInBackend(id, backendUpdates);
  invalidateCache('stockSpecs');
  return mapStockSpecToDomain(updated);
};

export const deleteStockItemStandardSpec = async (id: string) => {
  await deleteStockItemStandardSpecInBackend(id);
  invalidateCache('stockSpecs');
  return true;
};

// Stock Families
export const fetchStockFamilies = async () => {
  const items = await fetchStockFamiliesFromBackend();
  return items.map(mapStockFamilyToDomain);
};

export const fetchStockSubFamilies = async (familyCode: string) => {
  const items = await fetchStockSubFamiliesFromBackend(familyCode);
  return items.map(mapStockSubFamilyToDomain);
};

// Export as adapter object
export const stockAdapter = {
  fetchPurchaseRequests,
  fetchPurchaseRequestsByIntervention,
  createPurchaseRequest,
  updatePurchaseRequest,
  fetchStockItems,
  createStockItem,
  updateStockItem,
  deleteStockItem,
  fetchStockItemStandardSpecs,
  createStockItemStandardSpec,
  updateStockItemStandardSpec,
  deleteStockItemStandardSpec,
  fetchStockFamilies,
  fetchStockSubFamilies,
};
