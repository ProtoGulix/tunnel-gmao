/**
 * @fileoverview Onglet demandes d'achat — layout master-detail
 * @module components/purchase/tabs/PurchaseRequestsTab
 */

import { useEffect, useState } from 'react';
import { Box, Flex, Text } from '@radix-ui/themes';
import { MousePointerClick, ShoppingCart } from 'lucide-react';
import MasterDetailLayout from '@/components/ui/MasterDetailLayout';
import ErrorState from '@/components/ui/ErrorState';
import PurchaseRequestDetail from '@/components/purchase/PurchaseRequestDetail';
import PurchaseRequestEditForm from '@/components/purchase-requests/PurchaseRequestEditForm';
import { usePurchaseRequests } from '@/hooks/purchase/usePurchaseRequests';
import { useSelectedIdParam } from '@/hooks/shared/useSelectedIdParam';
import { fetchPurchaseRequestDetail, updatePurchaseRequest } from '@/api/purchaseRequests';
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

  // La DA sélectionnée est pilotée par l'URL (?requestId=...) : persistante, partageable,
  // compatible précédent/suivant du navigateur. Voir hooks/shared/useSelectedIdParam.
  const [requestId, setRequestId] = useSelectedIdParam('requestId');

  useEffect(() => {
    if (!requestId) { setSelected(null); return; }
    let cancelled = false;
    setMode(null);
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
    setRequestId(null);
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
        <PurchaseRequestListItem key={item.id} item={item} isSelected={item.id === requestId} onClick={handleSelect} />
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
