/**
 * @fileoverview Hook liste des references fournisseur (part_supplier_ref), toutes ou filtrées par fournisseur
 * @module hooks/suppliers/useSupplierPartRefs
 */

import { useCallback, useEffect, useState } from 'react';
import { fetchSupplierPartRefs } from '@/api/parts';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

const PAGE_SIZE = 50;

export function useSupplierPartRefs({ supplierId = '', search = '' } = {}) {
  const [refs, setRefs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSupplierPartRefs({
        supplierId: supplierId || undefined,
        search: search || undefined,
        limit: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      });
      const items = Array.isArray(data.items) ? data.items : [];
      const pg = data.pagination || {};
      setRefs(items);
      setTotal(pg.total ?? items.length);
      setTotalPages(pg.total_pages ?? 1);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Erreur lors du chargement des références fournisseur'));
    } finally {
      setLoading(false);
    }
  }, [supplierId, search, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Revenir en page 1 quand le filtre ou la recherche change
  useEffect(() => {
    setPage(1);
  }, [supplierId, search]);

  return {
    refs, loading, error, refresh: load, total,
    pagination: { currentPage: page, totalPages, onPageChange: setPage },
  };
}
