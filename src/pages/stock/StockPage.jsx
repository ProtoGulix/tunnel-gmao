/**
 * @fileoverview Page stock
 * @module pages/stock/StockPage
 */

import { lazy, Suspense, useRef } from 'react';
import { Box, Flex, Tabs, Text } from '@radix-ui/themes';
import { Factory, Package, Truck } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import LoadingState from '@/components/ui/LoadingState';
import { useTabNavigation } from '@/hooks/shared/useTabNavigation';

const PartsTab = lazy(() => import('@/components/stock/tabs/PartsTab'));
const SuppliersTab = lazy(() => import('@/components/suppliers/tabs/SuppliersTab'));
const ManufacturersTab = lazy(() => import('@/components/manufacturers/ManufacturersTab'));

export default function StockPage() {
  const { activeTab, setActiveTab } = useTabNavigation('items', 'tab');
  const partsTabRef = useRef(null);

  return (
    <>
      <PageHeader
        title="Stock"
        subtitle="Pièces, fournisseurs et fabricants"
        onAdd={activeTab === 'items' ? () => partsTabRef.current?.openCreate() : undefined}
        addLabel="Nouvelle pièce"
      />

      <Box px="4">
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

        <Suspense fallback={<LoadingState />}>
          <Tabs.Content value="items">
            {activeTab === 'items' && <PartsTab ref={partsTabRef} />}
          </Tabs.Content>
          <Tabs.Content value="suppliers">
            {activeTab === 'suppliers' && <SuppliersTab />}
          </Tabs.Content>
          <Tabs.Content value="manufacturers">
            {activeTab === 'manufacturers' && <ManufacturersTab />}
          </Tabs.Content>
        </Suspense>
      </Tabs.Root>
      </Box>
    </>
  );
}
