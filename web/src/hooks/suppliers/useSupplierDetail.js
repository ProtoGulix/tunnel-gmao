/**
 * @fileoverview Hook detail fournisseur + liaisons pieces
 * @module hooks/suppliers/useSupplierDetail
 */

import { useCallback, useEffect, useState } from 'react';
import {
  fetchSupplierDetail,
  fetchSupplierItemLinks,
  updateSupplier,
  deleteSupplier,
  createSupplierItemLink,
  updateSupplierItemLink,
  deleteSupplierItemLink,
  setPreferredSupplierItemLink,
} from '@/api/suppliers';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

export function useSupplierDetail(supplierId) {
  const [supplier, setSupplier] = useState(null);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!supplierId) return;
    setLoading(true);
    setError(null);
    try {
      const [detail, itemLinks] = await Promise.all([
        fetchSupplierDetail(supplierId),
        fetchSupplierItemLinks(supplierId),
      ]);
      setSupplier(detail);
      setLinks(Array.isArray(itemLinks) ? itemLinks : []);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Erreur lors du chargement du fournisseur'));
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => {
    load();
  }, [load]);

  const editSupplier = useCallback(
    async (updates) => {
      const updated = await updateSupplier(supplierId, updates);
      setSupplier(updated);
      return updated;
    },
    [supplierId]
  );

  const removeSupplier = useCallback(async () => {
    await deleteSupplier(supplierId);
  }, [supplierId]);

  const addLink = useCallback(
    async (payload) => {
      const created = await createSupplierItemLink({ ...payload, supplier_id: supplierId });
      setLinks((prev) => [...prev, created]);
      return created;
    },
    [supplierId]
  );

  const editLink = useCallback(async (linkId, updates) => {
    const updated = await updateSupplierItemLink(linkId, updates);
    setLinks((prev) => prev.map((l) => (l.id === linkId ? updated : l)));
    return updated;
  }, []);

  const removeLink = useCallback(async (linkId) => {
    await deleteSupplierItemLink(linkId);
    setLinks((prev) => prev.filter((l) => l.id !== linkId));
  }, []);

  const setPreferred = useCallback(async (linkId) => {
    const updated = await setPreferredSupplierItemLink(linkId);
    // L'API désélectionne automatiquement les autres — recharger pour refléter
    setLinks((prev) =>
      prev.map((l) => ({ ...l, is_preferred: l.id === linkId ? updated.is_preferred : false }))
    );
  }, []);

  return {
    supplier,
    links,
    loading,
    error,
    refresh: load,
    editSupplier,
    removeSupplier,
    addLink,
    editLink,
    removeLink,
    setPreferred,
  };
}
