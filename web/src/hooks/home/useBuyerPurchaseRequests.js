/**
 * @fileoverview Données de la vue "acheteur" : DA groupées par statut dérivé,
 * filtrables par site.
 * @module hooks/home/useBuyerPurchaseRequests
 */

import { useState, useEffect, useCallback } from 'react';
import { fetchPurchaseRequests } from '@/api/purchaseRequests';

const PAGE_SIZE = 200;

export function useBuyerPurchaseRequests({ site } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPurchaseRequests({
        limit: PAGE_SIZE,
        site: site || undefined,
      });
      setItems(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [site]);

  useEffect(() => { load(); }, [load]);

  return { items, loading, error, reload: load };
}
