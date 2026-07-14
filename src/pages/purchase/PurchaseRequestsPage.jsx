/**
 * @fileoverview Page de gestion des demandes d'achat et paniers fournisseurs
 * @module pages/purchase/PurchaseRequestsPage
 */

import { useCallback, useEffect, useState } from 'react';
import { AlertDialog, Box, Button, Flex, Tabs, Text } from '@radix-ui/themes';
import { FileUp, Scale, ShoppingBag, ShoppingCart, Zap } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import PurchaseRequestsTab from '@/components/purchase/tabs/PurchaseRequestsTab';
import SupplierOrdersTab from '@/components/purchase/tabs/SupplierOrdersTab';
import SupplierOrderComparatorTab from '@/components/purchase/tabs/SupplierOrderComparatorTab';
import DispatchBanner from '@/components/purchase/DispatchBanner';
import SpontaneousPurchaseRequestModal from '@/components/home/SpontaneousPurchaseRequestModal';
import CsvImportWizard from '@/components/purchase/CsvImportWizard';
import { useTabNavigation } from '@/hooks/shared/useTabNavigation';
import { fetchPurchaseRequestFacets } from '@/api/purchaseRequests';

export default function PurchaseRequestsPage() {
  const { activeTab, setActiveTab } = useTabNavigation('requests', 'tab');
  const [modalOpen, setModalOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);

  // Compteur PENDING_DISPATCH en temps réel, indépendant du filtre actif
  const [pendingDispatchCount, setPendingDispatchCount] = useState(0);
  const loadPendingCount = useCallback(async () => {
    try {
      const data = await fetchPurchaseRequestFacets();
      setPendingDispatchCount(data.pending_dispatch_count ?? 0);
    } catch {
      // non-bloquant
    }
  }, []);

  // Chargement initial + polling 30s + rechargement après création de DA ou changement d'onglet
  useEffect(() => {
    loadPendingCount();
    const id = setInterval(loadPendingCount, 30_000);
    return () => clearInterval(id);
  }, [loadPendingCount, refreshSignal, activeTab]);

  // Fonctions dispatch exposées par le tab actif
  const [dispatchFn, setDispatchFn] = useState(null);
  const [dispatching, setDispatchingState] = useState(false);
  const [dispatchResult, setDispatchResult] = useState(null);

  const handleDispatchStateChange = useCallback((state) => {
    setDispatchFn(() => state.onDispatch);
    setDispatchingState(state.dispatching);
    setDispatchResult(state.dispatchResult);
  }, []);

  const handleDispatch = useCallback(async () => {
    if (!dispatchFn) return;
    await dispatchFn();
    await loadPendingCount();
  }, [dispatchFn, loadPendingCount]);

  const dispatchAction = activeTab === 'requests' && pendingDispatchCount > 0 ? {
    label: (
      <AlertDialog.Root>
        <AlertDialog.Trigger>
          <Button color="blue" size="2" disabled={dispatching}>
            <Zap size={16} />
            {dispatching ? 'Dispatch en cours...' : `Dispatcher (${pendingDispatchCount})`}
          </Button>
        </AlertDialog.Trigger>
        <AlertDialog.Content maxWidth="420px">
          <AlertDialog.Title>Confirmer le dispatch</AlertDialog.Title>
          <AlertDialog.Description>
            {pendingDispatchCount} demande{pendingDispatchCount > 1 ? 's' : ''} d&apos;achat {pendingDispatchCount > 1 ? 'vont être dispatchées' : 'va être dispatchée'} vers les paniers fournisseurs.
          </AlertDialog.Description>
          <Flex gap="2" justify="end" mt="4">
            <AlertDialog.Cancel>
              <Button variant="soft" color="gray">Annuler</Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button color="blue" onClick={handleDispatch}>
                <Zap size={14} /> Confirmer
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    ),
  } : null;

  const headerActions = [
    ...(dispatchAction ? [dispatchAction] : []),
    {
      label: 'Import CSV',
      icon: FileUp,
      onClick: () => setImportOpen(true),
    },
    {
      label: 'Nouvelle demande',
      icon: ShoppingCart,
      onClick: () => setModalOpen(true),
    },
  ];

  return (
    <Flex direction="column" style={{ height: '100%', minHeight: 0 }}>
      <PageHeader
        title="Achats"
        subtitle="Demandes d'achat et paniers fournisseurs"
        actions={headerActions}
      />

      <Box px="4" style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'requests' && dispatchResult && (
          <DispatchBanner
            dispatchResult={dispatchResult}
            onClearResult={() => setDispatchResult(null)}
          />
        )}

        <Tabs.Root
          value={activeTab}
          onValueChange={setActiveTab}
          style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        >
          <Tabs.List style={{ borderBottom: '1px solid var(--gray-6)', flexShrink: 0 }}>
            <Tabs.Trigger value="requests">
              <Flex align="center" gap="2">
                <ShoppingCart size={14} />
                <Text>Demandes d&apos;achat</Text>
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value="orders">
              <Flex align="center" gap="2">
                <ShoppingBag size={14} />
                <Text>Paniers fournisseurs</Text>
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value="comparateur">
              <Flex align="center" gap="2">
                <Scale size={14} />
                <Text>Comparateur</Text>
              </Flex>
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="requests" style={{ flex: 1, minHeight: 0 }}>
            {activeTab === 'requests' && (
              <PurchaseRequestsTab
                refreshSignal={refreshSignal}
                onDispatchStateChange={handleDispatchStateChange}
              />
            )}
          </Tabs.Content>

          <Tabs.Content value="orders" style={{ flex: 1, minHeight: 0 }}>
            {activeTab === 'orders' && <SupplierOrdersTab />}
          </Tabs.Content>

          <Tabs.Content value="comparateur" style={{ flex: 1, minHeight: 0 }}>
            {activeTab === 'comparateur' && <SupplierOrderComparatorTab />}
          </Tabs.Content>
        </Tabs.Root>
      </Box>

      <SpontaneousPurchaseRequestModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={() => setRefreshSignal((n) => n + 1)}
      />

      <CsvImportWizard
        open={importOpen}
        onOpenChange={setImportOpen}
        onSuccess={() => setRefreshSignal((n) => n + 1)}
      />
    </Flex>
  );
}
