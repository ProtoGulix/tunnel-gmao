/**
 * @fileoverview Page de gestion des demandes d'achat et paniers fournisseurs
 * @module pages/purchase/PurchaseRequestsPage
 */

import { Container, Flex, Tabs, Text } from '@radix-ui/themes';
import { ShoppingBag, ShoppingCart } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import PurchaseRequestsTab from '@/components/purchase/tabs/PurchaseRequestsTab';
import SupplierOrdersTab from '@/components/purchase/tabs/SupplierOrdersTab';
import { useTabNavigation } from '@/hooks/shared/useTabNavigation';

export default function PurchaseRequestsPage() {
  const { activeTab, setActiveTab } = useTabNavigation('requests', 'tab');

  return (
    <Container>
      <PageHeader title="Achats" subtitle="Demandes d'achat et paniers fournisseurs" />

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
        </Tabs.List>

        <Tabs.Content value="requests">
          {activeTab === 'requests' && <PurchaseRequestsTab />}
        </Tabs.Content>

        <Tabs.Content value="orders">
          {activeTab === 'orders' && <SupplierOrdersTab />}
        </Tabs.Content>
      </Tabs.Root>
    </Container>
  );
}
