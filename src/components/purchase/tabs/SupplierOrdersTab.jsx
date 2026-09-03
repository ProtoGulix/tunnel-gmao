/**
 * @fileoverview Onglet paniers fournisseurs — layout master-detail
 *
 * Sélecteur de statut utilisé comme filtre du master (OPEN, SENT, ACK, RECEIVED, CLOSED, CANCELLED),
 * plus une vue "Actifs" par défaut (tout sauf CLOSED/CANCELLED) et un filtre par fournisseur —
 * cf. hooks/purchase/useSupplierOrderFilters. Sélection d'un panier dans la liste → détail
 * dans le panneau droit (transitions, export CSV/email, suppression, édition inline des
 * lignes en négociation).
 *
 * @module components/purchase/tabs/SupplierOrdersTab
 */

import { useCallback, useEffect, useRef } from 'react';
import { Box, Flex, Text } from '@radix-ui/themes';
import { ShoppingBag } from 'lucide-react';
import MasterDetailLayout from '@/components/ui/MasterDetailLayout';
import ErrorState from '@/components/ui/ErrorState';
import SupplierOrderDetail from '@/components/purchase/SupplierOrderDetail';
import { useSupplierOrders, TERMINAL_SUPPLIER_ORDER_STATUSES } from '@/hooks/purchase/useSupplierOrders';
import { useSupplierOrderFilters, ACTIVE_STATUS_FILTER } from '@/hooks/purchase/useSupplierOrderFilters';
import { exportSupplierOrderCsv, fetchSupplierOrderDetail } from '@/api/supplierOrders';
import { SupplierOrderListItem, StatusSelect, SupplierFilterSelect } from './SupplierOrdersTabParts';

function emptyStateMessage(search, activeTab, statusInfo) {
  if (search) return 'Aucun panier ne correspond à la recherche';
  if (activeTab === ACTIVE_STATUS_FILTER) return 'Aucun panier actif';
  return statusInfo?.label ? `Aucun panier « ${statusInfo.label} »` : 'Aucun panier fournisseur';
}

async function downloadSupplierOrderCsv(id) {
  const blob = await exportSupplierOrderCsv(id);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `commande-${id}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function SupplierOrdersTab() {
  const {
    activeTab, setActiveTab, statusList, facetsWithActive, statusMap,
    suppliers, supplierId, handleStatusChange, handleSupplierChange,
    searchParams, setSearchParams,
  } = useSupplierOrderFilters();
  const statusInfo = statusList.find((s) => s.code === activeTab);
  const selectedId = searchParams.get('order_id') || null;

  const { items, loading, error, search, setSearch, refresh, removeOrder } = useSupplierOrders({
    status: activeTab === ACTIVE_STATUS_FILTER ? '' : activeTab,
    supplierId,
    activeOnly: activeTab === ACTIVE_STATUS_FILTER,
  });

  // Arrivée via order_id dont le statut n'est pas visible sous le filtre actif (ex: lien
  // depuis le comparateur) : aligne panier_status sur le statut réel du panier pour
  // qu'il apparaisse aussi dans la liste de gauche. Sous le filtre virtuel "Actifs", un
  // panier reste visible (donc pas de resynchro) tant que son statut n'est pas terminal —
  // un simple clic dans la liste "Actifs" ne doit jamais faire basculer le filtre.
  // La ref de génération ignore les résolutions obsolètes : si l'utilisateur change
  // le filtre manuellement pendant que ce fetch est en vol, on ne doit pas l'écraser
  // (sinon le filtre choisi "flashe" puis revient en arrière).
  const statusSyncGeneration = useRef(0);
  useEffect(() => {
    if (!selectedId) return;
    const generation = ++statusSyncGeneration.current;
    fetchSupplierOrderDetail(selectedId)
      .then((order) => {
        if (statusSyncGeneration.current !== generation) return;
        if (!order?.status) return;
        const isVisibleUnderCurrentFilter = activeTab === order.status
          || (activeTab === ACTIVE_STATUS_FILTER && !TERMINAL_SUPPLIER_ORDER_STATUSES.includes(order.status));
        if (!isVisibleUnderCurrentFilter) setActiveTab(order.status);
      })
      .catch(() => {});
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelect = useCallback((row) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (prev.get('order_id') === row.id) {
        next.delete('order_id');
      } else {
        next.set('order_id', row.id);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const handleDelete = async () => {
    if (!selectedId) return;
    await removeOrder(selectedId);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete('order_id');
      return next;
    }, { replace: true });
  };

  const handleExportCsv = async (id) => {
    try {
      await downloadSupplierOrderCsv(id);
    } catch {
      // non-blocking
    }
  };

  if (error) return <ErrorState error={error} onRetry={refresh} />;

  const isEmpty = items.length === 0 && !loading;
  const masterList = isEmpty ? (
    <Flex direction="column" align="center" justify="center" gap="2" style={{ height: 200, padding: 24 }}>
      <ShoppingBag size={28} color="var(--gray-7)" />
      <Text size="2" color="gray">{emptyStateMessage(search, activeTab, statusInfo)}</Text>
    </Flex>
  ) : (
    <div style={{ padding: '8px 10px' }}>
      {items.map((item) => (
        <SupplierOrderListItem
          key={item.id}
          item={item}
          isSelected={item.id === selectedId}
          onClick={handleSelect}
          statusMap={statusMap}
        />
      ))}
    </div>
  );

  const headerExtra = (
    <Flex gap="2" wrap="wrap">
      <Box style={{ flex: 1, minWidth: 180 }}>
        <StatusSelect statusList={statusList} facets={facetsWithActive} activeTab={activeTab} onChange={handleStatusChange} />
      </Box>
      <Box style={{ flex: 1, minWidth: 180 }}>
        <SupplierFilterSelect suppliers={suppliers} value={supplierId} onChange={handleSupplierChange} />
      </Box>
    </Flex>
  );

  return (
    <Flex direction="column" pt="3" style={{ height: '100%', minHeight: 400 }}>
      <div style={{ flex: 1, minHeight: 0 }}>
        <MasterDetailLayout
          freeDetail
          ratio="38% 1fr"
          masterProps={{
            count: items.length,
            search,
            onSearchChange: setSearch,
            loading,
            children: masterList,
            headerExtra,
          }}
          detailChildren={selectedId ? (
            <SupplierOrderDetail
              orderId={selectedId}
              onDelete={handleDelete}
              onExportCsv={handleExportCsv}
              onStatusChange={refresh}
            />
          ) : null}
          emptyLabel="Sélectionnez un panier pour voir son détail"
        />
      </div>
    </Flex>
  );
}
