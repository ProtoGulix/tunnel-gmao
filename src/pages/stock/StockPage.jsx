/**
 * @fileoverview Page stock
 * @module pages/stock/StockPage
 */

import { Box, Flex, Tabs, Text } from '@radix-ui/themes';
import { Factory, Package, Truck } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import StockItemsTab from '@/components/stock/tabs/StockItemsTab';
import SuppliersTab from '@/components/suppliers/tabs/SuppliersTab';
import ManufacturersTab from '@/components/manufacturers/ManufacturersTab';
import { useTabNavigation } from '@/hooks/shared/useTabNavigation';

export default function StockPage() {
  const { activeTab, setActiveTab } = useTabNavigation('items', 'tab');

  return (
    <Box px="4">
      <PageHeader title="Stock" subtitle="Pièces, fournisseurs et fabricants" />

      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List style={{ borderBottom: '1px solid var(--gray-6)' }}>
          <Tabs.Trigger value="items">
            <Flex align="center" gap="2">
              <Package size={14} />
              <Text>Pièces référencées</Text>
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="suppliers">
            <Flex align="center" gap="2">
              <Truck size={14} />
              <Text>Fournisseurs</Text>
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="manufacturers">
            <Flex align="center" gap="2">
              <Factory size={14} />
              <Text>Fabricants</Text>
            </Flex>
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="items">
          {activeTab === 'items' && <StockItemsTab />}
        </Tabs.Content>
        <Tabs.Content value="suppliers">
          {activeTab === 'suppliers' && <SuppliersTab />}
        </Tabs.Content>
        <Tabs.Content value="manufacturers">
          {activeTab === 'manufacturers' && <ManufacturersTab />}
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}
