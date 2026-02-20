// Adapter for stock specs domain (Directus)
import * as datasource from './datasource';
import * as mapper from './mapper';

/**
 * Fetch all standard specifications with optional search term
 */
export const fetchStockSpecs = async (searchTerm = '') => {
  const rawSpecs = await datasource.fetchStockSpecs(searchTerm);
  return rawSpecs.map((spec: Record<string, unknown>) => mapper.mapStockSpecToDomain(spec));
};

/**
 * Fetch specifications for a specific stock item
 */
export const fetchStockSpecsForItem = async (stockItemId: string) => {
  const rawSpecs = await datasource.fetchStockSpecsForItem(stockItemId);
  return rawSpecs.map((spec: Record<string, unknown>) => mapper.mapStockSpecToDomain(spec));
};

/**
 * Search all standard specifications with optional search term
 */
export const searchAllStandardSpecs = async (searchTerm = '') => {
  const rawSpecs = await datasource.fetchStockSpecs(searchTerm);
  return rawSpecs.map((spec: Record<string, unknown>) => mapper.mapStockSpecToDomain(spec));
};

/**
 * Copy an existing specification to another stock item
 */
export const copyStandardSpec = async (sourceSpecId: string, targetStockItemId: string) => {
  // 1. Fetch source spec
  const sourceData = await datasource.fetchStockSpec(sourceSpecId);

  // 2. Create new spec with mapper
  const payload = mapper.mapStockSpecDomainToBackend({
    stockItemId: targetStockItemId,
    title: sourceData.title,
    text: sourceData.spec_text,
    isDefault: false, // Don't copy "default" status
  });

  const newData = await datasource.createStockSpec(payload);
  return mapper.mapStockSpecToDomain(newData);
};

export const stockSpecsAdapter = {
  fetchStockSpecs,
  fetchStockSpecsForItem,
  searchAllStandardSpecs,
  copyStandardSpec,
};
