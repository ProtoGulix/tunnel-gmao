/**
 * @fileoverview Page de gestion des demandes d'achat et paniers fournisseurs
 * @module pages/purchase/PurchaseRequestsPage
 */

import { useState } from 'react';
import { Box, Flex, Tabs, Text } from '@radix-ui/themes';
import { Archive, ShoppingBag, ShoppingCart } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import PurchaseRequestsTab from '@/components/purchase/tabs/PurchaseRequestsTab';
import SupplierOrdersTab from '@/components/purchase/tabs/SupplierOrdersTab';
import SpontaneousPurchaseRequestModal from '@/components/home/SpontaneousPurchaseRequestModal';
import { useTabNavigation } from '@/hooks/shared/useTabNavigation';

export default function PurchaseRequestsPage() {
  const { activeTab, setActiveTab } = useTabNavigation('requests', 'tab');
  const [modalOpen, setModalOpen] = useState(false);
  const [refreshSignal, setRefreshSignal] = useState(0);

  const headerActions = [{
    label: 'Nouvelle demande',
    icon: ShoppingCart,
    onClick: () => setModalOpen(true),
  }];

  return (
    <>
      <PageHeader
        title="Achats"
        subtitle="Demandes d'achat et paniers fournisseurs"
        actions={headerActions}
      />

      <Box px="4">
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          <Tabs.List style={{ borderBottom: '1px solid var(--gray-6)' }}>
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
            <Tabs.Trigger value="archives">
              <Flex align="center" gap="2">
                <Archive size={14} />
                <Text>Archives</Text>
              </Flex>
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="requests">
            {activeTab === 'requests' && <PurchaseRequestsTab refreshSignal={refreshSignal} />}
          </Tabs.Content>

          <Tabs.Content value="orders">
            {activeTab === 'orders' && <SupplierOrdersTab />}
          </Tabs.Content>

          <Tabs.Content value="archives">
            {activeTab === 'archives' && <PurchaseRequestsTab variant="archive" />}
          </Tabs.Content>
        </Tabs.Root>
      </Box>

      <SpontaneousPurchaseRequestModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSuccess={() => setRefreshSignal((n) => n + 1)}
      />
    </>
  );
}
