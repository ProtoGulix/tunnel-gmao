/**
 * @fileoverview Page fournisseurs
 * @module pages/suppliers/SuppliersPage
 */

import { Container, Flex, Tabs, Text } from '@radix-ui/themes';
import { Factory, Truck } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import SuppliersTab from '@/components/suppliers/tabs/SuppliersTab';
import ManufacturersTab from '@/components/manufacturers/ManufacturersTab';
import { useTabNavigation } from '@/hooks/shared/useTabNavigation';

export default function SuppliersPage() {
  const { activeTab, setActiveTab } = useTabNavigation('suppliers', 'tab');

  return (
    <>
      <PageHeader title="Fournisseurs" subtitle="Repertoire, liaisons pieces et fabricants" />

      <Container>
      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List style={{ borderBottom: '1px solid var(--gray-6)' }}>
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

        <Tabs.Content value="suppliers">
          {activeTab === 'suppliers' && <SuppliersTab />}
        </Tabs.Content>

        <Tabs.Content value="manufacturers">
          {activeTab === 'manufacturers' && <ManufacturersTab />}
        </Tabs.Content>
      </Tabs.Root>
      </Container>
    </>
  );
}
