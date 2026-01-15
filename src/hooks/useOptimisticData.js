/**
 * Hook pour gérer les données avec mises à jour optimistes
 * Évite les rechargements complets de page en mettant à jour l'état local d'abord
 * 
 * @module hooks/useOptimisticData
 */

import { useState, useCallback, useRef } from 'react';

/**
 * Hook générique pour gérer les données avec stratégie optimiste
 * 
 * @param {Function} fetchFn - Fonction de chargement des données depuis l'API
 * @param {Function} onError - Callback en cas d'erreur
 * @returns {Object} État et fonctions de gestion
 */
export const useOptimisticData = (fetchFn, onError) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [version, setVersion] = useState(0);
  const abortControllerRef = useRef(null);

  /**
   * Charge les données depuis l'API
   * @param {boolean} showLoading - Afficher le spinner de chargement
   * @param {boolean} silent - Mode silencieux (pas d'erreur affichée)
   */
  const load = useCallback(
    async (showLoading = false, silent = false) => {
      try {
        // Annuler la requête précédente si elle existe
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        if (showLoading) setLoading(true);

        const result = await fetchFn({ signal: abortControllerRef.current.signal });
        setData(result);
        setVersion(v => v + 1);
        return result;
      } catch (error) {
        // Ignorer les erreurs d'annulation
        if (error.name === 'AbortError') return data;
        
        console.error('Erreur chargement données:', error);
        if (!silent) {
          onError?.('Impossible de charger les données');
        }
        return data;
      } finally {
        if (showLoading) setLoading(false);
        abortControllerRef.current = null;
      }
    },
    [fetchFn, onError, data]
  );

  /**
   * Met à jour un élément localement (optimiste)
   * @param {string|number} id - ID de l'élément
   * @param {Object} updates - Modifications à appliquer
   */
  const updateLocal = useCallback((id, updates) => {
    setData(prev => 
      prev.map(item => 
        item.id === id ? { ...item, ...updates } : item
      )
    );
    setVersion(v => v + 1);
  }, []);

  /**
   * Ajoute un élément localement
   * @param {Object} newItem - Nouvel élément
   */
  const addLocal = useCallback((newItem) => {
    setData(prev => [...prev, newItem]);
    setVersion(v => v + 1);
  }, []);

  /**
   * Supprime un élément localement
   * @param {string|number} id - ID de l'élément à supprimer
   */
  const removeLocal = useCallback((id) => {
    setData(prev => prev.filter(item => item.id !== id));
    setVersion(v => v + 1);
  }, []);

  /**
   * Remplace toutes les données
   * @param {Array} newData - Nouvelles données
   */
  const setDataDirect = useCallback((newData) => {
    setData(newData);
    setVersion(v => v + 1);
  }, []);

  /**
   * Invalide le cache et recharge
   */
  const invalidate = useCallback(() => {
    return load(true, false);
  }, [load]);

  return {
    data,
    loading,
    version,
    load,
    updateLocal,
    addLocal,
    removeLocal,
    setData: setDataDirect,
    invalidate,
  };
};

/**
 * Hook spécialisé pour les demandes d'achat avec mises à jour optimistes
 */
export const useOptimisticPurchaseRequests = (fetchFn, onError) => {
  const base = useOptimisticData(fetchFn, onError);

  /**
   * Met à jour le statut d'une DA localement
   */
  const updateStatus = useCallback((requestId, newStatus) => {
    base.updateLocal(requestId, { status: newStatus });
  }, [base]);

  /**
   * Lie un article existant à une DA localement
   */
  const linkItem = useCallback((requestId, stockItemId, itemLabel) => {
    base.updateLocal(requestId, {
      stock_item_id: stockItemId,
      stockItemId: stockItemId,
      item_label: itemLabel,
      itemLabel: itemLabel,
    });
  }, [base]);

  return {
    ...base,
    requests: base.data,
    updateStatus,
    linkItem,
  };
};

/**
 * Hook spécialisé pour les articles de stock
 */
export const useOptimisticStockItems = (fetchFn, onError) => {
  const base = useOptimisticData(fetchFn, onError);

  /**
   * Met à jour la quantité d'un article localement
   */
  const updateQuantity = useCallback((itemId, newQuantity) => {
    base.updateLocal(itemId, { quantity: newQuantity });
  }, [base]);

  return {
    ...base,
    stockItems: base.data,
    updateQuantity,
  };
};

/**
 * Hook spécialisé pour les commandes fournisseurs
 */
export const useOptimisticSupplierOrders = (fetchFn, onError) => {
  const base = useOptimisticData(fetchFn, onError);

  /**
   * Met à jour le statut d'une commande localement
   */
  const updateStatus = useCallback((orderId, newStatus) => {
    base.updateLocal(orderId, { status: newStatus });
  }, [base]);

  /**
   * Met à jour une ligne de commande dans une commande
   */
  const updateOrderLine = useCallback((orderId, lineId, lineUpdates) => {
    base.updateLocal(orderId, (order) => {
      const lines = order.lines || order.orderLines || [];
      return {
        lines: lines.map(line => 
          line.id === lineId ? { ...line, ...lineUpdates } : line
        ),
        orderLines: lines.map(line => 
          line.id === lineId ? { ...line, ...lineUpdates } : line
        ),
      };
    });
  }, [base]);

  return {
    ...base,
    orders: base.data,
    updateStatus,
    updateOrderLine,
  };
};
