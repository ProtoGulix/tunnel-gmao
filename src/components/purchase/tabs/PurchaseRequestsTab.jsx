/**
 * @fileoverview Onglet liste des demandes d'achat
 *
 * Liste toutes les DA avec filtre statut + urgence (Select).
 * Inline expand → détail complet via GET /purchase-requests/detail/{id}
 *
 * @module components/purchase/tabs/PurchaseRequestsTab
 */

import { useCallback, useEffect, useState } from 'react';
import { Badge, Box, Button, Flex, Select, Text } from '@radix-ui/themes';
import { Plus, ShoppingCart, AlertTriangle } from 'lucide-react';
import TableHeader from '@/components/ui/TableHeader';
import DataTable from '@/components/ui/DataTable';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import PurchaseRequestDetail from '@/components/purchase/PurchaseRequestDetail';
import DispatchBanner from '@/components/purchase/DispatchBanner';
import PurchaseRequestForm from '@/components/purchase-requests/PurchaseRequestForm';
import { usePurchaseRequests } from '@/hooks/purchase/usePurchaseRequests';
import { fetchPurchaseRequestDetail, fetchPurchaseRequestStatuses } from '@/api/purchaseRequests';

const URGENCY_OPTIONS = [
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'Haute' },
  { value: 'critical', label: 'Critique' },
];

const URGENCY_COLOR = { normal: 'gray', high: 'orange', critical: 'red' };

function StatusBadge({ derivedStatus }) {
  if (!derivedStatus) return <Text size="1" color="gray">—</Text>;
  const { label, color } = derivedStatus;
  return (
    <Badge
      size="1"
      style={color ? { background: color + '22', color, border: `1px solid ${color}44` } : {}}
    >
      {label}
    </Badge>
  );
}

const COLUMNS = [
  {
    header: 'Article',
    accessor: (row) => (
      <Flex direction="column" gap="1">
        <Flex align="center" gap="2">
          {row.urgent && <AlertTriangle size={12} color="var(--red-9)" />}
          <Text size="2" weight="medium">{row.item_label}</Text>
        </Flex>
        {row.stock_item_ref && (
          <Badge color="blue" variant="soft" size="1" style={{ width: 'fit-content' }}>
            {row.stock_item_ref}
          </Badge>
        )}
      </Flex>
    ),
  },
  {
    header: 'Qté',
    width: 80,
    accessor: (row) => <Text size="2">{row.quantity} {row.unit || 'pcs'}</Text>,
  },
  {
    header: 'Urgence',
    width: 90,
    accessor: (row) => (
      <Badge color={URGENCY_COLOR[row.urgency] || 'gray'} variant="soft" size="1">
        {URGENCY_OPTIONS.find((u) => u.value === row.urgency)?.label || 'Normal'}
      </Badge>
    ),
  },
  {
    header: 'Statut',
    width: 160,
    accessor: (row) => <StatusBadge derivedStatus={row.derived_status} />,
  },
  {
    header: 'Demandeur',
    width: 130,
    accessor: (row) => <Text size="1" color="gray">{row.requester_name || '—'}</Text>,
  },
  {
    header: 'Intervention',
    width: 160,
    accessor: (row) => row.intervention_code
      ? <Text size="1" color="gray">{row.intervention_code}</Text>
      : <Text size="1" color="gray">—</Text>,
  },
];

export default function PurchaseRequestsTab() {
  // Statuts dynamiques pour le Select filtre
  const [statuses, setStatuses] = useState([]);
  useEffect(() => {
    fetchPurchaseRequestStatuses()
      .then(setStatuses)
      .catch(() => setStatuses([]));
  }, []);

  const {
    items, loading, error,
    search, setSearch,
    status, setStatus,
    urgency, setUrgency,
    refresh,
    createItem, removeItem,
    dispatching, dispatchResult, setDispatchResult, dispatch,
    readyToDispatch,
  } = usePurchaseRequests();

  const [selected, setSelected] = useState(null);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [mode, setMode] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSelect = useCallback(async (row) => {
    if (row.id === expandedRowId && mode !== 'edit') {
      setSelected(null);
      setExpandedRowId(null);
      setMode(null);
      return;
    }
    setMode(null);
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
  }, [expandedRowId, mode]);

  const handleCreate = async (data) => {
    setSaving(true);
    try {
      await createItem(data);
      setMode(null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    await removeItem(selected.id);
    setSelected(null);
    setExpandedRowId(null);
    setMode(null);
  };

  const renderDetail = () => {
    if (detailLoading) return <LoadingState fullscreen={false} message="Chargement..." />;
    if (!selected) return null;
    return (
      <PurchaseRequestDetail
        item={selected}
        onEdit={() => setMode('edit')}
        onDelete={handleDelete}
      />
    );
  };

  if (error) return <ErrorState error={error} onRetry={refresh} />;

  const filters = (
    <Flex gap="2" align="center">
      <Select.Root
        value={status || '__all__'}
        onValueChange={(v) => setStatus(v === '__all__' ? '' : v)}
      >
        <Select.Trigger
          placeholder="Tous les statuts"
          variant={status ? 'soft' : 'surface'}
          color={status ? 'blue' : undefined}
        />
        <Select.Content>
          <Select.Item value="__all__">Tous les statuts</Select.Item>
          {statuses.map((s) => (
            <Select.Item key={s.code} value={s.code}>
              {s.label}
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>

      <Select.Root
        value={urgency || '__all__'}
        onValueChange={(v) => setUrgency(v === '__all__' ? '' : v)}
      >
        <Select.Trigger
          placeholder="Toutes urgences"
          variant={urgency ? 'soft' : 'surface'}
          color={urgency ? 'orange' : undefined}
        />
        <Select.Content>
          <Select.Item value="__all__">Toutes urgences</Select.Item>
          {URGENCY_OPTIONS.map((u) => (
            <Select.Item key={u.value} value={u.value}>{u.label}</Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Flex>
  );

  return (
    <Box>
      <DispatchBanner
        readyCount={readyToDispatch}
        dispatching={dispatching}
        dispatchResult={dispatchResult}
        onDispatch={dispatch}
        onClearResult={() => setDispatchResult(null)}
      />

      <TableHeader
        icon={ShoppingCart}
        title="Demandes d'achat"
        count={items.length}
        searchValue={search}
        onSearchChange={setSearch}
        loading={loading}
        showRefreshButton={false}
        actions={filters}
        rightActions={
          <Button size="2" color="blue" onClick={() => { setSelected(null); setMode('create'); }}>
            <Plus size={14} /> Nouvelle demande
          </Button>
        }
      />

      {mode === 'create' && (
        <Box mb="3">
          <PurchaseRequestForm
            onSubmit={handleCreate}
            loading={saving}
            onCancel={() => setMode(null)}
            submitLabel="Créer"
          />
        </Box>
      )}

      <DataTable
        columns={COLUMNS}
        data={items}
        loading={loading}
        getRowKey={(row) => row.id}
        onRowClick={handleSelect}
        rowHover
        rowStyles={(row) =>
          expandedRowId === row.id && mode !== 'create'
            ? { background: 'var(--accent-3)', boxShadow: 'inset 3px 0 0 var(--accent-9)' }
            : {}
        }
        isRowExpanded={(row) => row.id === expandedRowId && mode !== 'create'}
        renderExpandedRow={renderDetail}
        emptyState={
          <Flex direction="column" align="center" gap="2" py="6">
            <ShoppingCart size={32} color="var(--gray-8)" />
            <Text color="gray" size="2">Aucune demande d&apos;achat</Text>
          </Flex>
        }
      />
    </Box>
  );
}
