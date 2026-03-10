/**
 * @fileoverview Onglet archives des demandes d'achat (Reçues et Refusées)
 *
 * Version lecture seule : pas de création, pas d'édition, pas de dispatch.
 * Filtre statut limité à RECEIVED / REJECTED.
 *
 * @module components/purchase/tabs/PurchaseRequestsArchiveTab
 */

import { useCallback, useEffect, useState } from 'react';
import { Box, Badge, Flex, Select, Text } from '@radix-ui/themes';
import { Archive, ShoppingCart } from 'lucide-react';
import TableHeader from '@/components/ui/TableHeader';
import DataTable from '@/components/ui/DataTable';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import PurchaseRequestDetail from '@/components/purchase/PurchaseRequestDetail';
import { usePurchaseRequests } from '@/hooks/purchase/usePurchaseRequests';
import { fetchPurchaseRequestDetail } from '@/api/purchaseRequests';
import { COLUMNS } from './PurchaseRequestsTabParts';

// Statuts actifs exclus pour afficher uniquement les archives
const ACTIVE_STATUSES = 'TO_QUALIFY,NO_SUPPLIER_REF,PENDING_DISPATCH,OPEN,CONSULTATION,QUOTED,ORDERED,PARTIAL';

const ARCHIVE_STATUSES = [
  { code: 'RECEIVED', label: 'Reçu', color: '#10B981' },
  { code: 'REJECTED', label: 'Refusé', color: '#EF4444' },
];

function ArchiveFilters({ status, setStatus }) {
  return (
    <Select.Root
      value={status || '__all__'}
      onValueChange={(v) => setStatus(v === '__all__' ? '' : v)}
    >
      <Select.Trigger
        placeholder="Tous les archivés"
        variant={status ? 'soft' : 'surface'}
        color={status ? 'gray' : undefined}
      />
      <Select.Content>
        <Select.Item value="__all__">Tous les archivés</Select.Item>
        {ARCHIVE_STATUSES.map((s) => (
          <Select.Item key={s.code} value={s.code}>{s.label}</Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}

export default function PurchaseRequestsArchiveTab() {
  const {
    items, loading, error,
    search, setSearch,
    status, setStatus,
    refresh,
  } = usePurchaseRequests({ excludeStatuses: ACTIVE_STATUSES });

  const [selected, setSelected] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const handleSelect = useCallback(async (row) => {
    if (row.id === expandedRowId) {
      setSelected(null);
      setExpandedRowId(null);
      return;
    }
    setSelected(null);
    setExpandedRowId(row.id);
    setDetailLoading(true);
    try {
      const detail = await fetchPurchaseRequestDetail(row.id);
      setSelected(detail);
    } catch {
      setExpandedRowId(null);
    } finally {
      setDetailLoading(false);
    }
  }, [expandedRowId]);

  const renderDetail = () => {
    if (detailLoading) return <LoadingState fullscreen={false} message="Chargement..." />;
    if (!selected) return null;
    return <PurchaseRequestDetail item={selected} />;
  };

  if (error) return <ErrorState error={error} onRetry={refresh} />;

  return (
    <Box>
      <TableHeader
        icon={Archive}
        title="Archives"
        count={items.length}
        searchValue={search}
        onSearchChange={setSearch}
        loading={loading}
        showRefreshButton={false}
        actions={<ArchiveFilters status={status} setStatus={setStatus} />}
      />

      <DataTable
        columns={COLUMNS}
        data={items}
        loading={loading}
        getRowKey={(row) => row.id}
        onRowClick={handleSelect}
        rowHover
        rowStyles={(row) =>
          expandedRowId === row.id
            ? { background: 'var(--accent-3)', boxShadow: 'inset 3px 0 0 var(--accent-9)' }
            : {}
        }
        isRowExpanded={(row) => row.id === expandedRowId}
        renderExpandedRow={renderDetail}
        emptyState={
          <Flex direction="column" align="center" gap="2" py="6">
            <Archive size={32} color="var(--gray-8)" />
            <Text color="gray" size="2">Aucune demande archivée</Text>
          </Flex>
        }
      />
    </Box>
  );
}
