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
    <Flex direction="column" style={{ height: '100%', minHeight: 0 }}>
      <PageHeader
        title="Stock"
        subtitle="Pièces, fournisseurs et fabricants"
        onAdd={activeTab === 'items' ? () => partsTabRef.current?.openCreate() : undefined}
        addLabel="Nouvelle pièce"
      />

      <Box px="4" style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Tabs.Root
          value={activeTab}
          onValueChange={setActiveTab}
          style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
        >
          <Tabs.List style={{ borderBottom: '1px solid var(--gray-6)', flexShrink: 0 }}>
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
            <Tabs.Content value="items" style={{ flex: 1, minHeight: 0 }}>
              {activeTab === 'items' && <PartsTab ref={partsTabRef} />}
            </Tabs.Content>
            <Tabs.Content value="suppliers" style={{ flex: 1, minHeight: 0 }}>
              {activeTab === 'suppliers' && <SuppliersTab />}
            </Tabs.Content>
            <Tabs.Content value="manufacturers" style={{ flex: 1, minHeight: 0 }}>
              {activeTab === 'manufacturers' && <ManufacturersTab />}
            </Tabs.Content>
          </Suspense>
        </Tabs.Root>
      </Box>
    </Flex>
  );
}
