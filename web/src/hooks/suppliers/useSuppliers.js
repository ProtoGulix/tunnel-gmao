import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchSuppliers, createSupplier, updateSupplier } from '@/api/suppliers';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

export function useSuppliers({ initialSearch = '' } = {}) {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState(initialSearch);
  const abortRef = useRef(null);

  const load = useCallback(async (searchTerm = '') => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const ctrl = abortRef.current;

    setLoading(true);
    setError(null);
    try {
      const params = searchTerm ? { search: searchTerm } : {};
      const data = await fetchSuppliers(params);
      if (!ctrl.signal.aborted) setSuppliers(Array.isArray(data) ? data : []);
    } catch (err) {
      if (!ctrl.signal.aborted) setError(extractApiErrorMessage(err, 'Erreur lors du chargement des fournisseurs'));
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(initialSearch);
    return () => abortRef.current?.abort();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
    load(value);
  }, [load]);

  const addSupplier = useCallback(async (payload) => {
    const created = await createSupplier(payload);
    await load(search);
    return created;
  }, [load, search]);

  const editSupplier = useCallback(async (id, payload) => {
    const updated = await updateSupplier(id, payload);
    setSuppliers((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
    return updated;
  }, []);

  return {
    suppliers, loading, error, search,
    setSearch: handleSearchChange,
    refresh: () => load(search),
    createSupplier: addSupplier,
    updateSupplier: editSupplier,
  };
}
