/**
 * @fileoverview Page stock
 * @module pages/stock/StockPage
 */

import { Container, Flex, Tabs, Text } from '@radix-ui/themes';
import { Layers, Package, Shapes } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import StockItemsTab from '@/components/stock/tabs/StockItemsTab';
import StockFamiliesTab from '@/components/stock/tabs/StockFamiliesTab';
import StockTemplatesTab from '@/components/stock/tabs/StockTemplatesTab';
import { useTabNavigation } from '@/hooks/shared/useTabNavigation';

export default function StockPage() {
  const { activeTab, setActiveTab } = useTabNavigation('items', 'tab');

  return (
    <Container>
      <PageHeader title="Stock" subtitle="Pieces referencees et familles" />

      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List style={{ borderBottom: '1px solid var(--gray-6)' }}>
          <Tabs.Trigger value="items">
            <Flex align="center" gap="2">
              <Package size={14} />
              <Text>Pieces referencees</Text>
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="families">
            <Flex align="center" gap="2">
              <Layers size={14} />
              <Text>Familles et sous-familles</Text>
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="templates">
            <Flex align="center" gap="2">
              <Shapes size={14} />
              <Text>Trames de reference</Text>
            </Flex>
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="items">
          <StockItemsTab />
        </Tabs.Content>

        <Tabs.Content value="families">
          <StockFamiliesTab />
        </Tabs.Content>

        <Tabs.Content value="templates">
          <StockTemplatesTab />
        </Tabs.Content>
      </Tabs.Root>
    </Container>
  );
}
