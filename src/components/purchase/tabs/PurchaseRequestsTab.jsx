/**
 * @fileoverview Onglet demandes d'achat — layout master-detail
 * @module components/purchase/tabs/PurchaseRequestsTab
 */

import { useCallback, useEffect, useState } from 'react';
import { Box, Flex, Text } from '@radix-ui/themes';
import { MousePointerClick, ShoppingCart } from 'lucide-react';
import MasterDetailLayout from '@/components/ui/MasterDetailLayout';
import ErrorState from '@/components/ui/ErrorState';
import PurchaseRequestDetail from '@/components/purchase/PurchaseRequestDetail';
import PurchaseRequestEditForm from '@/components/purchase-requests/PurchaseRequestEditForm';
import { usePurchaseRequests } from '@/hooks/purchase/usePurchaseRequests';
import { fetchPurchaseRequestDetail, fetchPurchaseRequestStatuses, updatePurchaseRequest } from '@/api/purchaseRequests';
import { PrFilters, PurchaseRequestListItem } from './PurchaseRequestsTabParts';

// ─── Empty state détail ───────────────────────────────────────────────────────

function DetailEmptyState({ label }) {
  return (
    <Flex direction="column" align="center" justify="center" gap="3" style={{ height: '100%', padding: 32, opacity: 0.6 }}>
      <ShoppingCart size={36} color="var(--gray-7)" />
      <Flex direction="column" align="center" gap="1">
        <Text size="2" weight="medium" color="gray">{label}</Text>
        <Flex align="center" gap="1">
          <MousePointerClick size={12} color="var(--gray-8)" />
          <Text size="1" color="gray">Cliquez sur une demande pour voir son détail</Text>
        </Flex>
      </Flex>
    </Flex>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function PurchaseRequestsTab({ refreshSignal, onDispatchStateChange }) {
  const [statuses, setStatuses] = useState([]);
  useEffect(() => {
    fetchPurchaseRequestStatuses().then(setStatuses).catch(() => setStatuses([]));
  }, []);

  const {
    items, loading, error,
    search, setSearch,
    status, setStatus,
    urgency, setUrgency,
    refresh, removeItem,
    dispatching, dispatchResult, setDispatchResult, dispatch,
    readyToDispatch,
  } = usePurchaseRequests({ initialStatus: 'TO_QUALIFY' });

  useEffect(() => { if (refreshSignal) refresh(); }, [refreshSignal, refresh]);

  useEffect(() => {
    onDispatchStateChange?.({ onDispatch: dispatch, dispatching, dispatchResult });
  }, [dispatching, dispatch, dispatchResult, onDispatchStateChange]);

  const [selected, setSelected] = useState(null);
  const [mode, setMode] = useState(null); // 'edit' | null
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSelect = useCallback(async (row) => {
    if (row.id === selected?.id && mode !== 'edit') { setSelected(null); setMode(null); return; }
    setMode(null);
    setSelected(null);
    setDetailLoading(true);
    try {
      setSelected(await fetchPurchaseRequestDetail(row.id));
    } catch {
      // laisse le détail vide
    } finally {
      setDetailLoading(false);
    }
  }, [selected, mode]);

  const handleUpdate = async (data) => {
    if (!selected) return;
    setSaving(true);
    try {
      await updatePurchaseRequest(selected.id, data);
      setSelected(await fetchPurchaseRequestDetail(selected.id));
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
    setMode(null);
  };

  const detailContent = () => {
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
    const handleRefresh = async () => {
      if (!selected) return;
      setDetailLoading(true);
      try {
        setSelected(await fetchPurchaseRequestDetail(selected.id));
      } finally {
        setDetailLoading(false);
      }
    };

    return (
      <PurchaseRequestDetail
        item={selected}
        onEdit={() => setMode('edit')}
        onDelete={handleDelete}
        onRefresh={handleRefresh}
      />
    );
  };

  if (error) return <ErrorState error={error} onRetry={refresh} />;

  const masterList = items.length === 0 && !loading ? (
    <Flex direction="column" align="center" justify="center" gap="2" style={{ height: 200, padding: 24 }}>
      <ShoppingCart size={28} color="var(--gray-7)" />
      <Text size="2" color="gray">Aucune demande d&apos;achat</Text>
    </Flex>
  ) : (
    <div style={{ padding: '8px 10px' }}>
      {items.map((item) => (
        <PurchaseRequestListItem key={item.id} item={item} isSelected={item.id === selected?.id} onClick={handleSelect} />
      ))}
    </div>
  );

  const headerExtra = (
    <PrFilters status={status} setStatus={setStatus} statuses={statuses} urgency={urgency} setUrgency={setUrgency} />
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
          detailChildren={detailContent() ?? <DetailEmptyState label="Aucune demande sélectionnée" />}
          detailLoading={detailLoading}
        />
      </div>
    </Box>
  );
}
