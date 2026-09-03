/**
 * Filtres de l'onglet "Paniers fournisseurs" : statut (avec une vue virtuelle "Actifs"
 * par défaut, qui regroupe tout sauf CLOSED/CANCELLED) et fournisseur. L'état vit dans
 * l'URL (panier_status, supplier_id) pour rester partageable/rechargeable.
 *
 * @module hooks/purchase/useSupplierOrderFilters
 */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTabNavigation } from '@/hooks/shared/useTabNavigation';
import { useSuppliers } from '@/hooks/suppliers/useSuppliers';
import { useSupplierOrderFacets, useSupplierOrderStatuses, TERMINAL_SUPPLIER_ORDER_STATUSES } from './useSupplierOrders';

export const ACTIVE_STATUS_FILTER = 'ACTIVE';

function sumActiveFacets(facets) {
  return Object.entries(facets).reduce(
    (sum, [code, count]) => (TERMINAL_SUPPLIER_ORDER_STATUSES.includes(code) ? sum : sum + count),
    0
  );
}

export function useSupplierOrderFilters() {
  const { activeTab, setActiveTab } = useTabNavigation(ACTIVE_STATUS_FILTER, 'panier_status');
  const facets = useSupplierOrderFacets();
  const { list: rawStatusList, map: statusMap } = useSupplierOrderStatuses();
  const { suppliers } = useSuppliers({});
  const [searchParams, setSearchParams] = useSearchParams();

  const sortedSuppliers = useMemo(
    () => [...suppliers].sort((a, b) => a.name.localeCompare(b.name)),
    [suppliers]
  );

  const statusList = useMemo(() => ([
    { code: ACTIVE_STATUS_FILTER, label: 'Actifs', color: 'var(--blue-9)', radixColor: 'blue' },
    ...rawStatusList,
  ]), [rawStatusList]);

  const facetsWithActive = useMemo(
    () => ({ ...facets, [ACTIVE_STATUS_FILTER]: sumActiveFacets(facets) }),
    [facets]
  );

  const supplierId = searchParams.get('supplier_id') || '';

  const handleStatusChange = useCallback((newStatus) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('panier_status', newStatus);
      next.delete('order_id');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const handleSupplierChange = useCallback((newSupplierId) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newSupplierId) next.set('supplier_id', newSupplierId); else next.delete('supplier_id');
      next.delete('order_id');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  return {
    activeTab, setActiveTab,
    statusList, facetsWithActive, statusMap,
    suppliers: sortedSuppliers, supplierId,
    handleStatusChange, handleSupplierChange,
    searchParams, setSearchParams,
  };
}
