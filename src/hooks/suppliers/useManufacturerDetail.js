/**
 * @fileoverview Hook detail fabricant avec liaisons fournisseur-piece
 * @module hooks/suppliers/useManufacturerDetail
 */

import { useCallback, useEffect, useState } from 'react';
import { fetchManufacturerDetail } from '@/api/manufacturers';

export function useManufacturerDetail(manufacturerId) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!manufacturerId) {
      setDetail(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchManufacturerDetail(manufacturerId);
      setDetail(data);
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement du fabricant');
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [manufacturerId]);

  useEffect(() => {
    load();
  }, [load]);

  return { detail, loading, error, refresh: load };
}
