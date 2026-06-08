/**
 * @fileoverview Onglet archives des demandes d'achat (Reçues et Refusées)
 * @module components/purchase/tabs/PurchaseRequestsArchiveTab
 */

import { useCallback, useState } from 'react';
import { Flex, Select, Text } from '@radix-ui/themes';
import { Archive, ShoppingCart } from 'lucide-react';
import MasterDetailLayout from '@/components/ui/MasterDetailLayout';
import ErrorState from '@/components/ui/ErrorState';
import PurchaseRequestDetail from '@/components/purchase/PurchaseRequestDetail';
import { usePurchaseRequests } from '@/hooks/purchase/usePurchaseRequests';
import { fetchPurchaseRequestDetail } from '@/api/purchaseRequests';
import { PurchaseRequestListItem } from './PurchaseRequestsTabParts';

const ACTIVE_STATUSES = 'TO_QUALIFY,NO_SUPPLIER_REF,PENDING_DISPATCH,OPEN,CONSULTATION,QUOTED,ORDERED,PARTIAL';

const ARCHIVE_STATUSES = [
  { code: 'RECEIVED', label: 'Reçu', color: '#10B981' },
  { code: 'REJECTED', label: 'Refusé', color: '#EF4444' },
];

// ─── Filtre statut ────────────────────────────────────────────────────────────

function ArchiveFilters({ status, setStatus }) {
  return (
    <Select.Root
      value={status || '__all__'}
      onValueChange={(v) => setStatus(v === '__all__' ? '' : v)}
    >
      <Select.Trigger placeholder="Tous les archivés" variant={status ? 'soft' : 'surface'} color={status ? 'gray' : undefined} />
      <Select.Content>
        <Select.Item value="__all__">Tous les archivés</Select.Item>
        {ARCHIVE_STATUSES.map((s) => (
          <Select.Item key={s.code} value={s.code}>{s.label}</Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}

// ─── Onglet principal ─────────────────────────────────────────────────────────

export default function PurchaseRequestsArchiveTab() {
  const {
    items, loading, error,
    search, setSearch,
    status, setStatus,
    refresh,
  } = usePurchaseRequests({ excludeStatuses: ACTIVE_STATUSES });

  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const handleSelect = useCallback(async (row) => {
    if (row.id === selected?.id) { setSelected(null); return; }
    setSelected(null);
    setDetailLoading(true);
    try {
      setSelected(await fetchPurchaseRequestDetail(row.id));
    } catch {
      // laisse le détail vide
    } finally {
      setDetailLoading(false);
    }
  }, [selected]);

  if (error) return <ErrorState error={error} onRetry={refresh} />;

  const masterList = items.length === 0 && !loading ? (
    <Flex direction="column" align="center" justify="center" gap="2" style={{ height: 200, padding: 24 }}>
      <Archive size={28} color="var(--gray-7)" />
      <Text size="2" color="gray">Aucune demande archivée</Text>
    </Flex>
  ) : (
    <div style={{ padding: '8px 10px' }}>
      {items.map((item) => (
        <PurchaseRequestListItem key={item.id} item={item} isSelected={item.id === selected?.id} onClick={handleSelect} />
      ))}
    </div>
  );

  const detailContent = selected
    ? <PurchaseRequestDetail item={selected} />
    : (
      <Flex direction="column" align="center" justify="center" gap="3" style={{ height: '100%', padding: 32, opacity: 0.6 }}>
        <ShoppingCart size={36} color="var(--gray-7)" />
        <Text size="2" weight="medium" color="gray">Sélectionnez une demande pour voir son détail</Text>
      </Flex>
    );

  return (
    <div style={{ height: 'calc(100vh - 200px)', minHeight: 400 }}>
      <MasterDetailLayout
        freeDetail
        ratio="38% 1fr"
        masterProps={{
          icon: Archive,
          title: 'Archives',
          count: items.length,
          search,
          onSearchChange: setSearch,
          loading,
          children: masterList,
          headerExtra: <ArchiveFilters status={status} setStatus={setStatus} />,
        }}
        detailChildren={detailContent}
        detailLoading={detailLoading}
      />
    </div>
  );
}
