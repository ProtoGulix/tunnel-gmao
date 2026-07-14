/**
 * @fileoverview Hook stats de prix obtenus pour une piece chez un fournisseur (historique des commandes)
 * @module hooks/suppliers/useSupplierPriceStats
 */

import { useCallback, useEffect, useState } from 'react';
import { fetchSupplierPriceStats } from '@/api/supplierOrders';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

export function useSupplierPriceStats(partId, supplierId) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!partId || !supplierId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSupplierPriceStats(partId, supplierId);
      setStats(data);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Erreur lors du chargement des statistiques de prix'));
    } finally {
      setLoading(false);
    }
  }, [partId, supplierId]);

  useEffect(() => {
    load();
  }, [load]);

  return { stats, loading, error, refresh: load };
}
