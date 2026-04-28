/**
 * @fileoverview Hook liste des fournisseurs
 * @module hooks/suppliers/useSuppliers
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchSuppliers, createSupplier, updateSupplier } from '@/api/suppliers';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

export function useSuppliers({ initialSearch = '' } = {}) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState(initialSearch);
  const initialLoadRef = useRef(false);

  const load = useCallback(async (searchTerm = '') => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      const data = await fetchSuppliers(params);
      setSuppliers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Erreur lors du chargement des fournisseurs'));
      setSuppliers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialLoadRef.current) {
      initialLoadRef.current = true;
      load(initialSearch);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchChange = useCallback(
    (value) => {
      setSearch(value);
      load(value);
    },
    [load]
  );

  const addSupplier = useCallback(
    async (payload) => {
      const created = await createSupplier(payload);
      await load(search);
      return created;
    },
    [load, search]
  );

  const editSupplier = useCallback(async (id, payload) => {
    const updated = await updateSupplier(id, payload);
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
    return updated;
  }, []);

  return {
    suppliers,
    loading,
    error,
    search,
    setSearch: handleSearchChange,
    refresh: () => load(search),
    createSupplier: addSupplier,
    updateSupplier: editSupplier,
  };
}
