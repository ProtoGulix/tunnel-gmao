/**
 * @fileoverview Hook liste des references fournisseur (part_supplier_ref), toutes ou filtrées par fournisseur
 * @module hooks/suppliers/useSupplierPartRefs
 */

import { useCallback, useEffect, useState } from 'react';
import { fetchSupplierPartRefs } from '@/api/parts';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

export function useSupplierPartRefs({ supplierId = '', search = '' } = {}) {
  const [refs, setRefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSupplierPartRefs({
        supplierId: supplierId || undefined,
        search: search || undefined,
        limit: 500,
      });
      setRefs(Array.isArray(data.items) ? data.items : []);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Erreur lors du chargement des références fournisseur'));
    } finally {
      setLoading(false);
    }
  }, [supplierId, search]);

  useEffect(() => {
    load();
  }, [load]);

  return { refs, loading, error, refresh: load };
}
