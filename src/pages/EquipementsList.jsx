/**
 * @fileoverview Page liste des équipements avec onglet Classes
 * @module EquipementsList
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Flex, Text, Button, Container, Tabs, Badge } from '@radix-ui/themes';
import { Search, Eye, Layers } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import ErrorDisplay from '@/components/ErrorDisplay';
import EquipementHealthBadge from '@/components/common/EquipementHealthBadge';
import DataTable from '@/components/common/DataTable';
import EquipementClassesTab from '@/components/equipements/EquipementClassesTab';
import { useEquipements } from '@/hooks/useEquipements';
import { useApiCall } from '@/hooks/useApiCall';
import { useTabNavigation } from '@/hooks/useTabNavigation';
import { getApiAdapter } from '@/lib/api/adapters/provider';

const adapter = getApiAdapter();

/**
 * Page liste des équipements
 * Affiche tous les équipements avec santé, cause et hiérarchie
 * + onglet Classes d'équipement (CRUD)
 */
export default function EquipementsList() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useTabNavigation('equipements', 'tab');
  const [searchText, setSearchText] = useState('');

  const {
    getParentInfo,
    loading: cacheLoading,
    error: cacheError,
  } = useEquipements();

  const fetchEquipementsFn = useCallback(
    () => adapter.equipements.fetchEquipements(),
    []
  );
  const { data: rawList, loading, error, execute } = useApiCall(fetchEquipementsFn);

  useEffect(() => { execute(); }, [execute]);

  const list = useMemo(
    () => (Array.isArray(rawList) ? rawList : []),
    [rawList]
  );

  const filteredEquipements = useMemo(() => {
    if (!searchText.trim()) return list;
    const query = searchText.toLowerCase();
    return list.filter(
      (eq) =>
        (eq.code && eq.code.toLowerCase().includes(query)) ||
        (eq.name && eq.name.toLowerCase().includes(query))
    );
  }, [list, searchText]);

  const headerStats = useMemo(() => {
    const counts = list.reduce(
      (acc, eq) => {
        const level = eq?.health?.level || 'unknown';
        acc[level] = (acc[level] || 0) + 1;
        return acc;
      },
      { ok: 0, maintenance: 0, warning: 0, critical: 0, unknown: 0 }
    );
    return [
      { label: 'Total', value: list.length },
      { label: 'Critique', value: counts.critical },
      { label: 'Alerte', value: counts.warning },
      { label: 'Maintenance', value: counts.maintenance },
      { label: 'OK', value: counts.ok },
    ];
  }, [list]);

  const columns = useMemo(
    () => [
      {
        key: 'health',
        header: 'Santé',
        width: 120,
        render: (eq) => <EquipementHealthBadge level={eq.health.level} />,
      },
      {
        key: 'equipement',
        header: 'Équipement',
        render: (eq) => (
          <Flex direction="column">
            <Text weight="medium" size="2">{eq.code || '—'} – {eq.name}</Text>
          </Flex>
        ),
      },
      {
        key: 'class',
        header: 'Classe',
        render: (eq) =>
          eq.equipmentClass ? (
            <Badge variant="soft" size="1">{eq.equipmentClass.code}</Badge>
          ) : (
            <Text size="2" color="gray">—</Text>
          ),
      },
      {
        key: 'cause',
        header: 'Cause',
        render: (eq) => <Text size="2" color="gray">{eq.health.reason}</Text>,
      },
      {
        key: 'parent',
        header: 'Équipement mère',
        render: (eq) => {
          const p = getParentInfo(eq.parentId);
          return p ? (
            <Text size="2">{p.code || '—'} – {p.name}</Text>
          ) : (
            <Text size="2" color="gray">—</Text>
          );
        },
      },
      {
        key: 'action',
        header: 'Action',
        align: 'end',
        render: (eq) => (
          <Button size="1" variant="ghost" onClick={() => navigate(`/equipements/${eq.id}`)}>
            <Eye size={16} /> Voir
          </Button>
        ),
      },
    ],
    [getParentInfo, navigate]
  );

  if (error || cacheError) {
    return (
      <Container>
        <PageHeader title="Équipements" />
        <ErrorDisplay error={error || cacheError} />
      </Container>
    );
  }

  return (
    <Container>
      <PageHeader
        title="Équipements"
        description="Liste de tous les équipements"
        stats={headerStats}
        onRefresh={execute}
      />

      <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
        <Tabs.List style={{ borderBottom: '1px solid var(--gray-6)' }}>
          <Tabs.Trigger value="equipements">
            <Flex align="center" gap="2">
              <Search size={14} />
              <Text>Équipements</Text>
              <Badge color="gray" variant="soft" size="1">{list.length}</Badge>
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
          <Box overflowX="auto" pt="4">
            <DataTable
              headerProps={{
                icon: Search,
                title: 'Recherche',
                count: filteredEquipements.length,
                searchValue: searchText,
                onSearchChange: setSearchText,
                searchPlaceholder: 'Rechercher par code ou nom...',
                showSearchInput: true,
                showResetButton: true,
                showRefreshButton: false,
              }}
              columns={columns}
              data={filteredEquipements}
              loading={loading || cacheLoading}
              emptyState={{
                icon: Search,
                title: 'Aucun équipement trouvé',
                description: searchText.trim()
                  ? 'Aucun équipement ne correspond à votre recherche.'
                  : 'Aucun équipement disponible.',
              }}
            />
          </Box>
        </Tabs.Content>

        <Tabs.Content value="classes">
          <EquipementClassesTab />
        </Tabs.Content>
      </Tabs.Root>
    </Container>
  );
}
