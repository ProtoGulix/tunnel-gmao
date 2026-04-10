/**
 * @fileoverview Onglet détail d'un équipement
 * @module components/equipements/tabs/EquipementDetailTab
 *
 * Chef d'orchestre du détail équipement avec onglets
 */

import { useState } from 'react';
import { Box, Flex, Text, Tabs, Badge } from '@radix-ui/themes';
import { Info, BarChart3, Users, Wrench } from 'lucide-react';
import PropTypes from 'prop-types';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import EquipementInfoBanner from '@/components/equipements/EquipementInfoBanner';
import EquipementChildrenTab from './EquipementChildrenTab';
import EquipementInterventionsTab from './EquipementInterventionsTab';
import EquipementInfoTab from './EquipementInfoTab';
import EquipementStatsTab from './EquipementStatsTab';

function buildTabs(childrenCount, interventionsCount) {
  return [
    { id: 'info', label: 'Informations', icon: Info },
    { id: 'interventions', label: 'Interventions', icon: Wrench, badge: interventionsCount },
    { id: 'children', label: 'Enfants', icon: Users, badge: childrenCount },
    { id: 'stats', label: 'Statistiques', icon: BarChart3 },
  ];
}

export default function EquipementDetailTab({ id, equipement, loading, error, health, stats, statsLoading, interventions, childrenCount, parent }) {
  const [activeTab, setActiveTab] = useState('info');

  if (error) return <ErrorState error={error} />;
  if (loading && !equipement) return <LoadingState message="Chargement de l'équipement..." />;

  const tabs = buildTabs(childrenCount, interventions?.total || 0);

  return (
    <Box>
      <EquipementInfoBanner equipement={equipement} health={health} parent={parent} />

      <Tabs.Root value={activeTab} onValueChange={setActiveTab} style={{ width: '100%' }}>
        <Tabs.List style={{ borderBottom: '1px solid var(--gray-6)' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Tabs.Trigger key={tab.id} value={tab.id}>
                <Flex align="center" gap="2">
                  <Icon size={14} />
                  <Text>{tab.label}</Text>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <Badge color="gray" variant="soft" size="1">
                      {tab.badge}
                    </Badge>
                  )}
                </Flex>
              </Tabs.Trigger>
            );
          })}
        </Tabs.List>

        <Tabs.Content value="info">
          <EquipementInfoTab equipement={equipement} />
        </Tabs.Content>

        <Tabs.Content value="interventions">
          <EquipementInterventionsTab interventions={interventions} />
        </Tabs.Content>

        <Tabs.Content value="children">
          {activeTab === 'children' && (
            <EquipementChildrenTab parentId={id} childrenCount={childrenCount} />
          )}
        </Tabs.Content>

        <Tabs.Content value="stats">
          <EquipementStatsTab stats={stats} statsLoading={statsLoading} />
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}

EquipementDetailTab.propTypes = {
  id: PropTypes.string.isRequired,
  equipement: PropTypes.object,
  loading: PropTypes.bool,
  error: PropTypes.string,
  health: PropTypes.object,
  stats: PropTypes.object,
  statsLoading: PropTypes.bool,
  interventions: PropTypes.object,
  childrenCount: PropTypes.number,
  parent: PropTypes.shape({ id: PropTypes.string, code: PropTypes.string, name: PropTypes.string }),
};
