/**
 * @fileoverview Onglet liste des demandes d'achat
 *
 * Liste toutes les DA avec filtre statut + urgence (Select).
 * Inline expand → détail complet via GET /purchase-requests/detail/{id}
 *
 * @module components/purchase/tabs/PurchaseRequestsTab
 */

import { useCallback, useEffect, useState } from 'react';
import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { Plus, ShoppingCart } from 'lucide-react';
import TableHeader from '@/components/ui/TableHeader';
import DataTable from '@/components/ui/DataTable';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import PurchaseRequestDetail from '@/components/purchase/PurchaseRequestDetail';
import DispatchBanner from '@/components/purchase/DispatchBanner';
import PurchaseRequestForm from '@/components/purchase-requests/PurchaseRequestForm';
import PurchaseRequestEditForm from '@/components/purchase-requests/PurchaseRequestEditForm';
import { usePurchaseRequests } from '@/hooks/purchase/usePurchaseRequests';
import { fetchPurchaseRequestDetail, fetchPurchaseRequestStatuses, updatePurchaseRequest } from '@/api/purchaseRequests';
import { COLUMNS, PrFilters } from './PurchaseRequestsTabParts';

export default function PurchaseRequestsTab() {
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
  } = usePurchaseRequests({ excludeStatuses: 'RECEIVED,REJECTED' });

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

  const handleUpdate = async (data) => {
    if (!selected) return;
    setSaving(true);
    try {
      await updatePurchaseRequest(selected.id, data);
      const detail = await fetchPurchaseRequestDetail(selected.id);
      setSelected(detail);
      setMode(null);
      refresh();
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
    if (mode === 'edit') {
      return (
        <PurchaseRequestEditForm
          item={selected}
          onSubmit={handleUpdate}
          loading={saving}
          onCancel={() => setMode(null)}
        />
      );
    }
    return (
      <PurchaseRequestDetail
        item={selected}
        onEdit={() => setMode('edit')}
        onDelete={handleDelete}
      />
    );
  };

  if (error) return <ErrorState error={error} onRetry={refresh} />;

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
        actions={
          <PrFilters
            status={status}
            setStatus={setStatus}
            statuses={statuses}
            urgency={urgency}
            setUrgency={setUrgency}
          />
        }
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
