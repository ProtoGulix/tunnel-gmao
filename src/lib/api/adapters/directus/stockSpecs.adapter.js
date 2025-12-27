import { api, invalidateCache } from '@/lib/api/client';
import { apiCall } from '@/lib/api/errors';

// ============================================================================
// Response Mapper (Backend → Domain DTO)
// ============================================================================

/**
 * Maps a Directus stock spec to domain StockItemStandardSpec DTO.
 *
 * Field mappings:
 * - stock_item_id → stockItemId (ID or nested object)
 * - spec_text → text
 * - is_default → isDefault
 * - created_at → createdAt
 *
 * @param {Object} item - Raw Directus response item
 * @returns {Object|null} Domain StockItemStandardSpec DTO or null if input is null
 */
const mapStockSpecToDomain = (item) => {
  if (!item) return null;
  return {
    id: item.id,
    stockItemId:
      typeof item.stock_item_id === 'object' ? item.stock_item_id?.id : item.stock_item_id,
    title: item.title || undefined,
    text: item.spec_text || undefined,
    isDefault: item.is_default || false,
    createdAt: item.created_at || undefined,
    // Relations nested (optionnelles)
    stockItem:
      typeof item.stock_item_id === 'object' && item.stock_item_id?.id
        ? {
            id: item.stock_item_id.id,
            name: item.stock_item_id.name || undefined,
            ref: item.stock_item_id.ref || undefined,
          }
        : undefined,
  };
};

// ============================================================================
// Payload Mapper (Domain → Backend)
// ============================================================================

/**
 * Maps domain StockItemStandardSpec payload to Directus format.
 *
 * Selective field mapping (only defined fields are included).
 * Converts camelCase domain names to snake_case Directus names.
 *
 * @param {Object} payload - Domain StockItemStandardSpec payload
 * @param {string} [payload.stockItemId] - Stock item ID
 * @param {string} [payload.title] - Specification title
 * @param {string} [payload.text] - Specification text content
 * @param {boolean} [payload.isDefault] - Mark as default specification
 * @returns {Object} Directus-compatible payload
 */
const mapStockSpecDomainToBackend = (payload) => {
  const backend = {};
  if (payload.stockItemId !== undefined) backend.stock_item_id = payload.stockItemId;
  if (payload.title !== undefined) backend.title = payload.title;
  if (payload.text !== undefined) backend.spec_text = payload.text;
  if (payload.isDefault !== undefined) backend.is_default = payload.isDefault;
  return backend;
};

// ============================================================================
// API Methods
// ============================================================================

/**
 * Rechercher dans toutes les spécifications standard
 */
const searchAllStandardSpecs = async (searchTerm = '') => {
  return apiCall(async () => {
    const params = {
      limit: -1,
      fields: [
        'id',
        'stock_item_id',
        'title',
        'spec_text',
        'is_default',
        'created_at',
        'stock_item_id.id',
        'stock_item_id.name',
        'stock_item_id.ref',
      ].join(','),
      sort: '-created_at',
      _t: Date.now(),
    };

    // Ajouter le filtre de recherche si un terme est fourni
    if (searchTerm && searchTerm.trim()) {
      params.filter = {
        _or: [
          { title: { _icontains: searchTerm.trim() } },
          { spec_text: { _icontains: searchTerm.trim() } },
        ],
      };
    }

    const { data } = await api.get('/items/stock_item_standard_spec', { params });
    const items = data?.data || [];
    return items.map(mapStockSpecToDomain);
  }, 'SearchAllStandardSpecs');
};

/**
 * Copier une spécification existante vers un autre article
 */
const copyStandardSpec = async (sourceSpecId, targetStockItemId) => {
  return apiCall(async () => {
    // 1. Récupérer la spec source
    const { data: sourceData } = await api.get(`/items/stock_item_standard_spec/${sourceSpecId}`, {
      params: {
        fields: ['title', 'spec_text', 'is_default'].join(','),
      },
    });

    // 2. Créer la nouvelle spec avec le mapper
    const payload = mapStockSpecDomainToBackend({
      stockItemId: targetStockItemId,
      title: sourceData.data.title,
      text: sourceData.data.spec_text,
      isDefault: false, // Ne pas copier le statut "par défaut"
    });

    const { data: newData } = await api.post('/items/stock_item_standard_spec', payload);

    invalidateCache('stockSpecs');
    invalidateCache(`stockItems:${targetStockItemId}`);
    return mapStockSpecToDomain(newData.data);
  }, 'CopyStandardSpec');
};

// ============================================================================
// Export adapter
// ============================================================================

export const stockSpecsAdapter = {
  searchAllStandardSpecs,
  copyStandardSpec,
};
