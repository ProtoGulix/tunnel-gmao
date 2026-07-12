/**
 * @fileoverview Onglet paniers fournisseurs — layout master-detail
 *
 * Sélecteur de statut utilisé comme filtre du master (OPEN, SENT, ACK, RECEIVED, CLOSED, CANCELLED).
 * Sélection d'un panier dans la liste → détail dans le panneau droit (transitions,
 * export CSV/email, suppression, édition inline des lignes en négociation).
 *
 * @module components/purchase/tabs/SupplierOrdersTab
 */

import { useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Badge, Box, Flex, Select, Text } from '@radix-ui/themes';
import { ShoppingBag } from 'lucide-react';
import PropTypes from 'prop-types';
import MasterDetailLayout from '@/components/ui/MasterDetailLayout';
import ErrorState from '@/components/ui/ErrorState';
import SupplierOrderDetail from '@/components/purchase/SupplierOrderDetail';
import { useSupplierOrders, useSupplierOrderFacets, useSupplierOrderStatuses } from '@/hooks/purchase/useSupplierOrders';
import { exportSupplierOrderCsv, fetchSupplierOrderDetail } from '@/api/supplierOrders';
import { useTabNavigation } from '@/hooks/shared/useTabNavigation';
import { SupplierOrderListItem } from './SupplierOrdersTabParts';

// ─── Filtre statut (select) ─────────────────────────────────────────────────────

function StatusSelect({ statusList, facets, activeTab, onChange }) {
  return (
    <Flex direction="column" gap="1">
      <Text size="1" color="gray">Filtrer par statut</Text>
      <Select.Root value={activeTab} onValueChange={onChange}>
        <Select.Trigger variant="surface" style={{ width: '100%' }} />
        <Select.Content>
          {statusList.map((s) => (
            <Select.Item key={s.code} value={s.code}>
              <Flex align="center" gap="2">
                <span style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: s.color,
                  display: 'inline-block', flexShrink: 0,
                }} />
                <Text size="2">{s.label}</Text>
                {facets[s.code] != null && (
                  <Badge color={s.radixColor} variant="soft" size="1">{facets[s.code]}</Badge>
                )}
              </Flex>
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Flex>
  );
}

StatusSelect.propTypes = {
  statusList: PropTypes.array.isRequired,
  facets: PropTypes.object.isRequired,
  activeTab: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

// ─── Composant principal ──────────────────────────────────────────────────────

export default function SupplierOrdersTab() {
  const { activeTab, setActiveTab } = useTabNavigation('OPEN', 'panier_status');
  const facets = useSupplierOrderFacets();
  const { list: statusList } = useSupplierOrderStatuses();
  const statusInfo = statusList.find((s) => s.code === activeTab);

  const { items, loading, error, search, setSearch, refresh, removeOrder } = useSupplierOrders({ status: activeTab });

  // La sélection vit entièrement dans l'URL (order_id), au même titre que le filtre
  // de statut (panier_status) — un lien externe (ex: comparateur) ou un partage d'URL
  // reproduit exactement le même état, sans state React dupliqué.
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('order_id') || null;

  // Arrivée via order_id dont le statut ne correspond pas au filtre actif (ex: lien
  // depuis le comparateur) : aligne panier_status sur le statut réel du panier pour
  // qu'il apparaisse aussi dans la liste de gauche.
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
        if (order?.status && order.status !== activeTab) setActiveTab(order.status);
      })
      .catch(() => {});
  }, [selectedId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Changement manuel du filtre de statut : vide order_id pour éviter un détail
  // fantôme d'un panier qui ne serait plus dans la liste filtrée, et invalide toute
  // synchronisation automatique de statut encore en vol.
  const handleStatusChange = useCallback((newStatus) => {
    statusSyncGeneration.current += 1;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('panier_status', newStatus);
      next.delete('order_id');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

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
      const blob = await exportSupplierOrderCsv(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `commande-${id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // non-blocking
    }
  };

  if (error) return <ErrorState error={error} onRetry={refresh} />;

  const masterList = items.length === 0 && !loading ? (
    <Flex direction="column" align="center" justify="center" gap="2" style={{ height: 200, padding: 24 }}>
      <ShoppingBag size={28} color="var(--gray-7)" />
      <Text size="2" color="gray">
        {search
          ? 'Aucun panier ne correspond à la recherche'
          : statusInfo?.label ? `Aucun panier « ${statusInfo.label} »` : 'Aucun panier fournisseur'}
      </Text>
    </Flex>
  ) : (
    <div style={{ padding: '8px 10px' }}>
      {items.map((item) => (
        <SupplierOrderListItem key={item.id} item={item} isSelected={item.id === selectedId} onClick={handleSelect} />
      ))}
    </div>
  );

  const headerExtra = (
    <StatusSelect statusList={statusList} facets={facets} activeTab={activeTab} onChange={handleStatusChange} />
  );

  return (
    <Box pt="3" style={{ height: '100%', minHeight: 400, display: 'flex', flexDirection: 'column' }}>
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
    </Box>
  );
}
