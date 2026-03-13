/**
 * @fileoverview Page liste des équipements avec onglet Classes
 * @module pages/equipements/EquipementsPage
 */

import { useMemo } from 'react';
import { Container, Flex, Text, Badge, Tabs } from '@radix-ui/themes';
import { Search, Layers, Factory } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import EquipementTable from '@/components/equipements/EquipementTable';
import EquipementClassesTab from '@/components/equipements/tabs/EquipementClassesTab';
import { useTabNavigation } from '@/hooks/shared/useTabNavigation';
import { useEquipements } from '@/hooks/equipements/useEquipements';

/**
 * Page liste des équipements
 * Affiche tous les équipements avec santé + onglet Classes
 */
export default function EquipementsPage() {
  const { activeTab, setActiveTab } = useTabNavigation('equipements', 'tab');
  const {
    equipements, loading, error, getParentInfo, refresh,
    pagination, facets,
    page, setPage, pageSize, setPageSize,
    search, setSearch, classFilter, setClassFilter,
  } = useEquipements();

  const headerStats = useMemo(() => {
    const counts = equipements.reduce(
      (acc, eq) => { const level = eq?.health?.level || 'unknown'; acc[level] = (acc[level] || 0) + 1; return acc; },
      { ok: 0, maintenance: 0, warning: 0, critical: 0 }
    );
    return [
      { label: 'Total', value: pagination.total },
      { label: 'Critique', value: counts.critical },
      { label: 'Alerte', value: counts.warning },
      { label: 'Maintenance', value: counts.maintenance },
      { label: 'OK', value: counts.ok },
    ];
  }, [equipements, pagination.total]);

  return (
    <Container>
      <PageHeader
        title="Équipements"
        description="Liste de tous les équipements"
        stats={headerStats}
        onRefresh={refresh}
        icon={Factory}
      />

      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List style={{ borderBottom: '1px solid var(--gray-6)' }}>
          <Tabs.Trigger value="equipements">
            <Flex align="center" gap="2">
              <Search size={14} />
              <Text>Équipements</Text>
              <Badge color="gray" variant="soft" size="1">
                {equipements.length}
              </Badge>
            </Flex>
          </Tabs.Trigger>
          <Tabs.Trigger value="classes">
            <Flex align="center" gap="2">
              <Layers size={14} />
              <Text>Classes</Text>
            </Flex>
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="equipements">
          <EquipementTable
            equipements={equipements}
            loading={loading}
            error={error}
            getParentInfo={getParentInfo}
            search={search}
            onSearchChange={setSearch}
            classFilter={classFilter}
            onClassFilterChange={setClassFilter}
            facets={facets}
            pagination={pagination}
            page={page}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
          />
        </Tabs.Content>

        <Tabs.Content value="classes">
          <EquipementClassesTab />
        </Tabs.Content>
      </Tabs.Root>
    </Container>
  );
}
