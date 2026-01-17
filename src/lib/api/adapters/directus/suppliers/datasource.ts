// Directus datasource for suppliers domain
import { api, invalidateCache } from '@/lib/api/client';
import { apiCall } from '@/lib/api/errors';

interface ApiParams {
  limit?: number;
  sort?: string;
  fields?: string;
  filter?: Record<string, unknown>;
  aggregate?: Record<string, string>;
  _t?: number;
}

export const fetchSuppliers = async () => {
  return apiCall(async () => {
    const { data } = await api.get('/items/supplier', {
      params: {
        limit: -1,
        sort: 'name',
        fields: ['id', 'name', 'contact_name', 'email', 'phone', 'is_active'].join(','),
        _t: Date.now(),
      },
    });
    return data?.data || [];
  }, 'FetchSuppliers');
};

export const createSupplier = async (supplierData: Record<string, unknown>) => {
  return apiCall(async () => {
    const { data } = await api.post('/items/supplier', supplierData);
    invalidateCache('suppliers');
    return data?.data;
  }, 'CreateSupplier');
};

export const updateSupplier = async (id: string, updates: Record<string, unknown>) => {
  return apiCall(async () => {
    const { data } = await api.patch(`/items/supplier/${id}`, updates);
    invalidateCache('suppliers');
    return data?.data;
  }, 'UpdateSupplier');
};

export const deleteSupplier = async (id: string) => {
  return apiCall(async () => {
    await api.delete(`/items/supplier/${id}`);
    invalidateCache('suppliers');
    return true;
  }, 'DeleteSupplier');
};

export const fetchSupplierOrders = async (status: string | null = null) => {
  return apiCall(async () => {
    const params: ApiParams = {
      limit: -1,
      sort: '-created_at',
      fields: [
        'id',
        'order_number',
        'supplier_id.id',
        'supplier_id.name',
        'supplier_id.email',
        'supplier_id.contact_name',
        'order_lines.id',
        'order_lines.urgency',
        'status',
        'total_amount',
        'created_at',
        'ordered_at',
        'received_at',
      ].join(','),
      _t: Date.now(),
    };
    if (status) {
      params.filter = { status: { _eq: String(status).toUpperCase() } };
    }
    const { data } = await api.get('/items/supplier_order', { params });
    return data?.data || [];
  }, 'FetchSupplierOrders');
};

export const fetchSupplierOrder = async (id: string) => {
  return apiCall(async () => {
    const { data } = await api.get(`/items/supplier_order/${id}`, {
      params: {
        fields: ['*', 'supplier_id.id', 'supplier_id.name', 'supplier_id.email'].join(','),
        _t: Date.now(),
      },
    });
    return data?.data;
  }, 'FetchSupplierOrder');
};

export const fetchSupplierOrderLines = async (supplierOrderId: string) => {
  return apiCall(async () => {
    console.log(`[fetchSupplierOrderLines] Loading lines for order ${supplierOrderId}`);
    // 1. Fetch lines with embedded purchase_requests (M2M) already joined
    const { data: linesData } = await api.get('/items/supplier_order_line', {
      params: {
        filter: { supplier_order_id: { _eq: supplierOrderId } },
        fields: [
          'id',
          'supplier_order_id',
          'stock_item_id.id',
          'stock_item_id.ref',
          'stock_item_id.name',
          'stock_item_id.family_code',
          'stock_item_id.sub_family_code',
          'stock_item_id.dimension',
          'stock_item_id.location',
          'stock_item_id.unit',
          'supplier_ref_snapshot',
          'quantity',
          'urgency',
          'unit_price',
          'total_price',
          'created_at',
          'quote_received',
          'is_selected',
          'quote_price',
          'lead_time_days',
          'manufacturer',
          'manufacturer_ref',
          'quote_received_at',
          'rejected_reason',
          // Relations M2M déjà embarquées
          'purchase_requests.id',
          'purchase_requests.purchase_request_id.id',
          'purchase_requests.purchase_request_id.status',
          'purchase_requests.purchase_request_id.urgency',
          'purchase_requests.purchase_request_id.requested_by',
          'purchase_requests.purchase_request_id.intervention_id',
          'purchase_requests.purchase_request_id.intervention_id.code',
          // Récupérer les supplier_order_line_ids avec tous les détails des lignes jumelles
          'purchase_requests.purchase_request_id.supplier_order_line_ids.id',
          'purchase_requests.purchase_request_id.supplier_order_line_ids.supplier_order_line_id.id',
          'purchase_requests.purchase_request_id.supplier_order_line_ids.supplier_order_line_id.is_selected',
          'purchase_requests.purchase_request_id.supplier_order_line_ids.supplier_order_line_id.quote_received',
          'purchase_requests.purchase_request_id.supplier_order_line_ids.supplier_order_line_id.quote_price',
          'purchase_requests.purchase_request_id.supplier_order_line_ids.supplier_order_line_id.unit_price',
          'purchase_requests.purchase_request_id.supplier_order_line_ids.supplier_order_line_id.supplier_ref_snapshot',
          'purchase_requests.purchase_request_id.supplier_order_line_ids.supplier_order_line_id.supplier_order_id.id',
          'purchase_requests.purchase_request_id.supplier_order_line_ids.supplier_order_line_id.supplier_order_id.order_number',
          'purchase_requests.purchase_request_id.supplier_order_line_ids.supplier_order_line_id.supplier_order_id.status',
          'purchase_requests.purchase_request_id.supplier_order_line_ids.supplier_order_line_id.supplier_order_id.supplier_id.id',
          'purchase_requests.purchase_request_id.supplier_order_line_ids.supplier_order_line_id.supplier_order_id.supplier_id.name',
        ].join(','),
        sort: 'created_at',
        _t: Date.now(),
      },
    });
    
    const lines = linesData?.data || [];
    console.log(`[fetchSupplierOrderLines] Loaded ${lines.length} lines`);
    if (lines.length > 0) {
      console.log('[fetchSupplierOrderLines] First line structure:', JSON.stringify(lines[0], null, 2));
    }

    // 2. Fetch all stock_item_supplier links with manufacturer data
    const { data: suppliersData } = await api.get('/items/stock_item_supplier', {
      params: {
        fields: [
          'id',
          'stock_item_id',
          'supplier_ref',
          'manufacturer_item_id.id',
          'manufacturer_item_id.manufacturer_ref',
          'manufacturer_item_id.manufacturer_name',
          'manufacturer_item_id.designation',
        ].join(','),
        limit: -1,
        _t: Date.now(),
      },
    });
    
    const supplierLinks = suppliersData?.data || [];
    
    // 3. Enrich lines with manufacturer data (purchase_requests already embedded)
    const enrichedLines = lines.map((line: Record<string, unknown>) => {
      const stockItem = line.stock_item_id as Record<string, unknown> | undefined;
      const stockItemId = stockItem?.id || line.stock_item_id;
      const supplierRef = line.supplier_ref_snapshot;
      
      // Find matching supplier link for manufacturer data
      const matchingLink = supplierLinks.find(
        (link: Record<string, unknown>) =>
          link.stock_item_id === stockItemId && link.supplier_ref === supplierRef
      );
      
      return {
        ...line,
        manufacturer_item_id: matchingLink?.manufacturer_item_id || null,
      };
    });
    
    console.log(`[fetchSupplierOrderLines] Enriched ${enrichedLines.length} lines with PR and manufacturer data`);
    return enrichedLines;
  }, 'FetchSupplierOrderLines');
};

    /**
     * PURGE PANIER FOURNISSEUR
     * Supprime toutes les lignes d'un panier et remet les demandes d'achat associées en status "open".
     */
    export const purgeSupplierOrder = async (supplierOrderId: string) => {
      return apiCall(async () => {
        // 1) Récupérer toutes les lignes du panier
        const { data: linesData } = await api.get('/items/supplier_order_line', {
          params: {
            filter: { supplier_order_id: { _eq: supplierOrderId } },
            fields: ['id'].join(','),
            limit: -1,
          },
        });

        const lines = linesData?.data || [];
        const lineIds = lines.map((l: any) => l.id).filter(Boolean);

        // 2) Récupérer tous les liens M2M pour ces lignes
        const { data: m2mData } = await api.get('/items/supplier_order_line_purchase_request', {
          params: {
            filter: { supplier_order_line_id: { _in: lineIds } },
            fields: ['id', 'purchase_request_id'].join(','),
            limit: -1,
          },
        });

        const m2mLinks = m2mData?.data || [];
        console.log('[PurgeSupplierOrder] M2M Links raw:', m2mLinks);
        
        const m2mLinkIds = m2mLinks.map((link: any) => link.id).filter(Boolean);
        
        // Extraire les IDs des purchase_requests
        const purchaseRequestIds = Array.from(
          new Set(
            m2mLinks.map((link: any) => {
              // purchase_request_id peut être un ID direct ou un objet
              const prId = typeof link.purchase_request_id === 'object' 
                ? link.purchase_request_id?.id 
                : link.purchase_request_id;
              console.log('[PurgeSupplierOrder] Extracted PR ID:', prId, 'from:', link.purchase_request_id);
              return prId;
            }).filter(Boolean)
          )
        );

        console.log('[PurgeSupplierOrder] Found:', {
          lineIds: lineIds.length,
          m2mLinkIds: m2mLinkIds.length,
          purchaseRequestIds: purchaseRequestIds,
        });

        // 3) Remettre les DA en attente de dispatch
        let resetCount = 0;
        for (const prId of purchaseRequestIds) {
          try {
            console.log(`[PurgeSupplierOrder] Attempting to reset PR ${prId} to open...`);
            const response = await api.patch(`/items/purchase_request/${prId}`, { status: 'open' });
            console.log(`[PurgeSupplierOrder] Successfully reset PR ${prId}:`, response.data);
            resetCount++;
          } catch (err) {
            console.error(`[PurgeSupplierOrder] Failed to reset PR ${prId}:`, err);
            if (err && typeof err === 'object' && 'response' in err) {
              console.error('[PurgeSupplierOrder] Error response:', (err as any).response);
            }
          }
        }
        console.log(`[PurgeSupplierOrder] Reset ${resetCount}/${purchaseRequestIds.length} purchase requests`);

        // 4) Supprimer les liens M2M individuellement
        for (const m2mId of m2mLinkIds) {
          await api.delete(`/items/supplier_order_line_purchase_request/${m2mId}`);
        }

        // 5) Supprimer les lignes du panier individuellement
        for (const lineId of lineIds) {
          await api.delete(`/items/supplier_order_line/${lineId}`);
        }

        // 6) Supprimer le panier lui-même
        await api.delete(`/items/supplier_order/${supplierOrderId}`);

        invalidateCache('supplierOrderLines');
        invalidateCache('supplierOrders');
        invalidateCache('purchaseRequests');

        return {
          resetRequests: purchaseRequestIds,
          deletedLines: lineIds,
          deletedOrder: supplierOrderId,
        };
      }, 'PurgeSupplierOrder');
    };

export const updateSupplierOrder = async (id: string, updates: Record<string, unknown>) => {
  return apiCall(async () => {
    const { data } = await api.patch(`/items/supplier_order/${id}`, updates);
    invalidateCache('supplierOrders');
    return data?.data;
  }, 'UpdateSupplierOrder');
};

export const dispatchPurchaseRequests = async () => {
  return apiCall(async () => {
    // Appeler la fonction PL/pgSQL via une requête SQL brute
    // Directus n'expose pas directement les fonctions, on doit passer par un query custom
    const query = `SELECT * FROM dispatch_purchase_requests();`;
    
    try {
      // Essayer d'exécuter via le SDK Directus (si configuré pour les requêtes SQL)
      const { data } = await api.post('/utils/query', {
        query,
      });
      
      const result = data?.data?.[0]?.dispatch_purchase_requests || data?.[0]?.dispatch_purchase_requests || { dispatched: [], toQualify: [], errors: [] };
      
      invalidateCache('purchaseRequests');
      invalidateCache('supplierOrders');
      
      return result;
    } catch (error) {
      console.error('[DispatchPurchaseRequests] SQL query failed, falling back to manual implementation', error);
      
      // Si l'appel SQL échoue, on revient à l'implémentation manuelle
      // mais cette fois on s'assure de tout faire correctement
      return await manualDispatch();
    }
  }, 'DispatchPurchaseRequests');
};

// Implémentation manuelle du dispatch (fallback si la fonction SQL n'est pas accessible)
async function manualDispatch() {
  const { data: reqData } = await api.get('/items/purchase_request', {
    params: {
      filter: { status: { _eq: 'open' } },
      fields: ['id', 'stock_item_id', 'quantity', 'urgency'].join(','),
      limit: -1,
    },
  });
  const purchaseRequests = reqData?.data || [];
  
  const { data: suppliersData } = await api.get('/items/stock_item_supplier', {
    params: {
      fields: ['stock_item_id', 'supplier_id', 'supplier_ref'].join(','),
      limit: -1,
    },
  });
  const supplierRefs = suppliersData?.data || [];
  
  const dispatched: string[] = [];
  const toQualify: string[] = [];
  const errors: any[] = [];
  
  for (const req of purchaseRequests) {
    if (!req.stock_item_id) continue;
    
    const itemSuppliers = supplierRefs.filter((s: any) => s.stock_item_id === req.stock_item_id);
    
    if (itemSuppliers.length === 0) {
      toQualify.push(req.id);
      continue;
    }
    
    let hasDispatched = false;
    
    for (const sup of itemSuppliers) {
      try {
        // Trouver ou créer le panier OPEN
        const { data: ordersData } = await api.get('/items/supplier_order', {
          params: {
            filter: { supplier_id: { _eq: sup.supplier_id }, status: { _eq: 'OPEN' } },
            limit: 1,
            sort: '-created_at',
          },
        });
        
        let orderId = ordersData?.data?.[0]?.id;
        
        if (!orderId) {
          const today = new Date();
          const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
          const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
          
          const { data: newOrder } = await api.post('/items/supplier_order', {
            order_number: `CMD-${dateStr}-${randomNum}`,
            supplier_id: sup.supplier_id,
            status: 'OPEN',
            total_amount: 0,
          });
          orderId = newOrder?.data?.id;
        }
        
        // Chercher ligne existante
        const { data: linesData } = await api.get('/items/supplier_order_line', {
          params: {
            filter: {
              supplier_order_id: { _eq: orderId },
              stock_item_id: { _eq: req.stock_item_id },
            },
            fields: ['id', 'urgency', 'quantity'].join(','),
            limit: 1,
          },
        });
        
        let lineId = linesData?.data?.[0]?.id;
        const currentLineUrgency = linesData?.data?.[0]?.urgency;
        const prioritizeUrgency = (a?: string, b?: string) => {
          const rank: Record<string, number> = { high: 3, normal: 2, low: 1 };
          const va = rank[a || ''] || 0;
          const vb = rank[b || ''] || 0;
          return va >= vb ? a : b;
        };
        const nextUrgency = prioritizeUrgency(currentLineUrgency, req.urgency);
        
        if (lineId) {
          // Incrémenter quantité
          await api.patch(`/items/supplier_order_line/${lineId}`, {
            quantity: (linesData.data[0].quantity || 0) + (req.quantity || 1),
            ...(nextUrgency ? { urgency: nextUrgency } : {}),
          });
        } else {
          // Créer nouvelle ligne
          const { data: newLine } = await api.post('/items/supplier_order_line', {
            supplier_order_id: orderId,
            stock_item_id: req.stock_item_id,
            supplier_ref_snapshot: sup.supplier_ref,
            quantity: req.quantity || 1,
            ...(req.urgency ? { urgency: req.urgency } : {}),
            quote_received: false,
            is_selected: false,
          });
          lineId = newLine?.data?.id;
        }
        
        // Créer lien M2M (avec ON CONFLICT géré par la contrainte unique)
        if (lineId) {
          try {
            await api.post('/items/supplier_order_line_purchase_request', {
              supplier_order_line_id: lineId,
              purchase_request_id: req.id,
              quantity: req.quantity || 1,
            });
          } catch (m2mError: any) {
            // Ignorer les erreurs de doublon (contrainte unique)
            if (!m2mError?.response?.data?.errors?.[0]?.message?.includes('duplicate')) {
              throw m2mError;
            }
          }
        }
        
        hasDispatched = true;
      } catch (err) {
        errors.push({ id: req.id, error: err instanceof Error ? err.message : 'Unknown error' });
      }
    }
    
    if (hasDispatched) {
      await api.patch(`/items/purchase_request/${req.id}`, { status: 'in_progress' });
      dispatched.push(req.id);
    }
  }
  
  invalidateCache('purchaseRequests');
  invalidateCache('supplierOrders');
  
  return { dispatched, toQualify, errors };
}

/**
 * CONSULTATION: Mettre à jour une ligne de panier (devis, sélection)
 *
 * @param {string} lineId - ID de la ligne
 * @param {Object} updates - Champs à mettre à jour
 *   - quoteReceived (boolean)
 *   - isSelected (boolean)
 *   - quotePrice (number)
 *   - leadTimeDays (number)
 *   - manufacturer (string)
 *   - manufacturerRef (string)
 *   - rejectedReason (string)
 * @returns {Promise<Object>} Ligne mise à jour
 */
export const updateSupplierOrderLine = async (
  lineId: string,
  updates: Record<string, unknown>
) => {
  return apiCall(async () => {
    // Mapper les champs camelCase en snake_case pour l'API
    const backendUpdates: Record<string, unknown> = {};

    const fieldMapping: Record<string, string> = {
      quoteReceived: 'quote_received',
      isSelected: 'is_selected',
      quotePrice: 'quote_price',
      leadTimeDays: 'lead_time_days',
      manufacturer: 'manufacturer',
      manufacturerRef: 'manufacturer_ref',
      quoteReceivedAt: 'quote_received_at',
      rejectedReason: 'rejected_reason',
    };

    for (const [camelKey, value] of Object.entries(updates)) {
      const snakeKey = fieldMapping[camelKey] || camelKey;
      backendUpdates[snakeKey] = value;
    }

    const { data } = await api.patch(
      `/items/supplier_order_line/${lineId}`,
      backendUpdates
    );

    invalidateCache('supplierOrderLines');
    invalidateCache('supplierOrders');

    return data?.data;
  }, 'UpdateSupplierOrderLine');
};

