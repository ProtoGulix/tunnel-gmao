/**
 * @fileoverview Onglet demandes d'achat — layout master-detail
 * @module components/purchase/tabs/PurchaseRequestsTab
 */

import { useEffect, useMemo, useState } from 'react';
import { Box } from '@radix-ui/themes';
import ErrorState from '@/components/ui/ErrorState';
import PurchaseRequestDetail from '@/components/purchase/PurchaseRequestDetail';
import PurchaseRequestEditForm from '@/components/purchase-requests/PurchaseRequestEditForm';
import { usePurchaseRequests } from '@/hooks/purchase/usePurchaseRequests';
import { useSelectedIdParam } from '@/hooks/shared/useSelectedIdParam';
import { useUnsavedChangesGuard } from '@/hooks/shared/useUnsavedChangesGuard';
import { fetchPurchaseRequestDetail, updatePurchaseRequest } from '@/api/purchaseRequests';
import { sortItems } from './PurchaseRequestsTabParts';
import { UnsavedChangesDialog, BulkDeleteDialog } from './PurchaseRequestsTabDialogs';
import PurchaseRequestsListView from './PurchaseRequestsListView';

// ─── Composant principal ──────────────────────────────────────────────────────

export default function PurchaseRequestsTab({ refreshSignal, onDispatchStateChange, facets }) {
  // Le dropdown de filtre affiche le référentiel exhaustif des statuts (même à 0
  // résultat) avec leur compteur réel, ex. « Reçu (183) ». Les facets sont chargées une
  // seule fois par le parent (PurchaseRequestsPage) et partagées ici — évite un double
  // appel /facets (un pour le badge de dispatch, un pour ce dropdown).
  const statuses = (facets?.by_status || []).map(
    (s) => ({ code: s.status, label: s.label, color: s.color, count: s.count })
  );

  const {
    items, loading, error,
    search, setSearch,
    status, setStatus,
    urgency, setUrgency,
    refresh, removeItem, removeItems,
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
  const [isEditDirty, setIsEditDirty] = useState(false);
  const [sort, setSort] = useState('age_desc');
  const [checkedIds, setCheckedIds] = useState(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const sortedItems = useMemo(() => sortItems(items, sort), [items, sort]);

  const toggleCheck = (id) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleCheckAll = (visibleItems) => {
    setCheckedIds((prev) => {
      const allChecked = visibleItems.every((item) => prev.has(item.id));
      if (allChecked) return new Set();
      return new Set(visibleItems.map((item) => item.id));
    });
  };

  const handleBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      await removeItems(Array.from(checkedIds));
      setCheckedIds(new Set());
      setBulkDeleteConfirm(false);
    } finally {
      setBulkDeleting(false);
    }
  };

  // La DA sélectionnée est pilotée par l'URL (?requestId=...) : persistante, partageable,
  // compatible précédent/suivant du navigateur. Voir hooks/shared/useSelectedIdParam.
  const [requestId, setRequestIdRaw] = useSelectedIdParam('requestId');

  const { guard, isConfirmOpen, confirmDiscard, cancelDiscard } = useUnsavedChangesGuard(mode === 'edit' && isEditDirty);

  const setRequestId = (id) => guard(() => setRequestIdRaw(id));

  useEffect(() => {
    if (!requestId) { setSelected(null); return; }
    let cancelled = false;
    setMode(null);
    setIsEditDirty(false);
    setDetailLoading(true);
    fetchPurchaseRequestDetail(requestId)
      .then((detail) => { if (!cancelled) setSelected(detail); })
      .catch(() => { if (!cancelled) setSelected(null); })
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [requestId]);

  const handleSelect = (row) => {
    setRequestId(row.id === requestId ? null : row.id);
  };

  const handleCancelEdit = () => guard(() => { setMode(null); setIsEditDirty(false); });

  const handleUpdate = async (data) => {
    if (!selected) return;
    setSaving(true);
    try {
      await updatePurchaseRequest(selected.id, data);
      setSelected(await fetchPurchaseRequestDetail(selected.id));
      setIsEditDirty(false);
      setMode(null);
      refresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    await removeItem(selected.id);
    setIsEditDirty(false);
    setRequestIdRaw(null);
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
          onCancel={handleCancelEdit}
          onDirtyChange={setIsEditDirty}
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

  return (
    <Box pt="3" style={{ height: '100%', minHeight: 400, display: 'flex', flexDirection: 'column' }}>
      <PurchaseRequestsListView
        items={sortedItems}
        loading={loading}
        search={search}
        setSearch={setSearch}
        status={status}
        setStatus={setStatus}
        statuses={statuses}
        urgency={urgency}
        setUrgency={setUrgency}
        sort={sort}
        setSort={setSort}
        selectedId={requestId}
        onSelect={handleSelect}
        checkedIds={checkedIds}
        onToggleCheck={toggleCheck}
        onToggleCheckAll={toggleCheckAll}
        onBulkDeleteClick={() => setBulkDeleteConfirm(true)}
        detailContent={detailContent()}
        detailLoading={detailLoading}
      />

      <UnsavedChangesDialog open={isConfirmOpen} onCancel={cancelDiscard} onConfirm={confirmDiscard} />

      <BulkDeleteDialog
        open={bulkDeleteConfirm}
        onOpenChange={setBulkDeleteConfirm}
        labels={items.filter((i) => checkedIds.has(i.id)).map((i) => i.code || i.item_label)}
        onConfirm={handleBulkDelete}
        deleting={bulkDeleting}
      />
    </Box>
  );
}
