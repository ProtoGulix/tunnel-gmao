/**
 * @fileoverview Onglet paniers fournisseurs par statut
 *
 * Tabs par statut de commande (OPEN, SENT, ACK, RECEIVED, CLOSED, CANCELLED).
 * Inline expand → détail commande + lignes.
 *
 * @module components/purchase/tabs/SupplierOrdersTab
 */

import { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Flex, Tabs, Text } from '@radix-ui/themes';
import { Building2, Clock, Info, Package, ShoppingBag } from 'lucide-react';
import TableHeader from '@/components/ui/TableHeader';
import DataTable from '@/components/ui/DataTable';
import ErrorState from '@/components/ui/ErrorState';
import SupplierOrderDetail from '@/components/purchase/SupplierOrderDetail';
import { useSupplierOrders, useSupplierOrderFacets, useSupplierOrderStatuses } from '@/hooks/purchase/useSupplierOrders';
import { exportSupplierOrderCsv } from '@/api/supplierOrders';
import { useTabNavigation } from '@/hooks/shared/useTabNavigation';

const AGE_COLOR_MAP = { gray: 'gray', orange: 'orange', red: 'red' };

const COLUMNS = [
  {
    header: 'N° commande',
    width: 180,
    accessor: (row) => (
      <Flex align="center" gap="2">
        <Text size="2" weight="medium">{row.order_number}</Text>
        {row.is_blocking && (
          <Badge color={AGE_COLOR_MAP[row.age_color] || 'gray'} variant="soft" size="1">
            <Clock size={10} /> {row.age_days}j
          </Badge>
        )}
      </Flex>
    ),
  },
  {
    header: 'Fournisseur',
    accessor: (row) => (
      <Flex align="center" gap="2">
        <Building2 size={13} color="var(--gray-9)" />
        <Text size="2">{row.supplier?.name || '—'}</Text>
      </Flex>
    ),
  },
  {
    header: 'Lignes',
    width: 80,
    accessor: (row) => (
      <Flex align="center" gap="1">
        <Package size={12} color="var(--gray-9)" />
        <Text size="2" color="gray">{row.line_count ?? 0}</Text>
      </Flex>
    ),
  },
  {
    header: 'Montant',
    width: 110,
    accessor: (row) => row.total_amount != null
      ? <Text size="2" weight="medium">{Number(row.total_amount).toFixed(2)} €</Text>
      : <Text size="1" color="gray">—</Text>,
  },
  {
    header: 'Créée le',
    width: 120,
    accessor: (row) => (
      <Text size="1" color="gray">
        {row.created_at ? new Date(row.created_at).toLocaleDateString('fr-FR') : '—'}
      </Text>
    ),
  },
];

function OrdersTable({ status, statusInfo }) {
  const { items, loading, error, refresh, removeOrder } = useSupplierOrders({ status });

  const [selectedId, setSelectedId] = useState(null);

  const handleSelect = useCallback((row) => {
    setSelectedId((prev) => (prev === row.id ? null : row.id));
  }, []);

  const handleDelete = async () => {
    if (!selectedId) return;
    await removeOrder(selectedId);
    setSelectedId(null);
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

  const renderDetail = () => {
    if (!selectedId) return null;
    return (
      <SupplierOrderDetail
        orderId={selectedId}
        onDelete={handleDelete}
        onExportCsv={handleExportCsv}
        onStatusChange={refresh}
      />
    );
  };

  if (error) return <ErrorState error={error} onRetry={refresh} />;

  return (
    <Box>
      {statusInfo?.description && (
        <Flex
          align="center" gap="2" px="3" py="2" mb="2"
          style={{ background: 'var(--blue-2)', borderRadius: 'var(--radius-2)', border: '1px solid var(--blue-5)' }}
        >
          <Info size={14} color="var(--blue-9)" style={{ flexShrink: 0 }} />
          <Text size="2" color="blue">{statusInfo.description}</Text>
        </Flex>
      )}
      <TableHeader
        icon={ShoppingBag}
        title="Paniers fournisseurs"
        count={items.length}
        searchValue=""
        onSearchChange={() => {}}
        loading={loading}
        showSearchInput={false}
        showRefreshButton={false}
      />
      <DataTable
        columns={COLUMNS}
        data={items}
        loading={loading}
        getRowKey={(row) => row.id}
        onRowClick={handleSelect}
        rowHover
        rowStyles={(row) =>
          selectedId === row.id
            ? { background: 'var(--accent-3)', boxShadow: 'inset 3px 0 0 var(--accent-9)' }
            : {}
        }
        isRowExpanded={(row) => row.id === selectedId}
        renderExpandedRow={renderDetail}
        emptyState={{
          icon: ShoppingBag,
          title: statusInfo?.label ? `Aucun panier « ${statusInfo.label} »` : 'Aucun panier fournisseur',
          description: statusInfo?.description,
        }}
      />
    </Box>
  );
}

OrdersTable.propTypes = {
  status: PropTypes.string.isRequired,
  statusInfo: PropTypes.shape({
    label: PropTypes.string,
    description: PropTypes.string,
  }),
};

export default function SupplierOrdersTab() {
  const { activeTab, setActiveTab } = useTabNavigation('OPEN', 'panier_status');
  const facets = useSupplierOrderFacets();
  const { list: statusList } = useSupplierOrderStatuses();

  return (
    <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
      <Tabs.List style={{ borderBottom: '1px solid var(--gray-6)' }}>
        {statusList.map((s) => (
          <Tabs.Trigger key={s.code} value={s.code}>
            <Flex align="center" gap="1">
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
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      {statusList.map((s) => (
        <Tabs.Content key={s.code} value={s.code}>
          {activeTab === s.code && (
            <Box pt="3">
              <OrdersTable status={s.code} statusInfo={s} />
            </Box>
          )}
        </Tabs.Content>
      ))}
    </Tabs.Root>
  );
}
