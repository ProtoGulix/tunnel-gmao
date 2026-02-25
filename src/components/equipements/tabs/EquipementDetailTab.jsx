/**
 * @fileoverview Onglet détail d'un équipement
 * @module components/equipements/tabs/EquipementDetailTab
 *
 * Chef d'orchestre du détail équipement avec onglets
 */

import { useState } from 'react';
import { Box, Card, Flex, Grid, Text, Tabs, Badge } from '@radix-ui/themes';
import { Info, BarChart3, Users, Wrench } from 'lucide-react';
import PropTypes from 'prop-types';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import EquipementInfoBanner from '@/components/equipements/EquipementInfoBanner';
import EquipementChildrenTab from './EquipementChildrenTab';
import EquipementInterventionsTab from './EquipementInterventionsTab';
import { useEquipementDetail } from '@/hooks/equipements/useEquipementDetail';

function buildTabs(childrenCount, interventionsCount) {
  return [
    { id: 'info', label: 'Informations', icon: Info },
    { id: 'interventions', label: 'Interventions', icon: Wrench, badge: interventionsCount },
    { id: 'children', label: 'Enfants', icon: Users, badge: childrenCount },
    { id: 'stats', label: 'Statistiques', icon: BarChart3 },
  ];
}

function InfoTab({ equipement }) {
  if (!equipement) return <Text color="gray">Aucune donnée</Text>;

  return (
    <Box py="4">
      <Flex direction="column" gap="4">
        {/* Informations générales */}
        <Box>
          <Text weight="medium" size="2" mb="3">
            Informations générales
          </Text>
          <Flex direction="column" gap="2">
            {equipement.no_machine && (
              <Flex justify="between">
                <Text size="2" color="gray">
                  N° Machine
                </Text>
                <Text size="2" weight="medium">
                  {equipement.no_machine}
                </Text>
              </Flex>
            )}
            {equipement.affectation && (
              <Flex justify="between">
                <Text size="2" color="gray">
                  Affectation
                </Text>
                <Text size="2" weight="medium">
                  {equipement.affectation}
                </Text>
              </Flex>
            )}
            {equipement.fabricant && (
              <Flex justify="between">
                <Text size="2" color="gray">
                  Fabricant
                </Text>
                <Text size="2" weight="medium">
                  {equipement.fabricant}
                </Text>
              </Flex>
            )}
            {equipement.numero_serie && (
              <Flex justify="between">
                <Text size="2" color="gray">
                  N° Série
                </Text>
                <Text size="2" weight="medium">
                  {equipement.numero_serie}
                </Text>
              </Flex>
            )}
            {equipement.date_mise_service && (
              <Flex justify="between">
                <Text size="2" color="gray">
                  Mise en service
                </Text>
                <Text size="2" weight="medium">
                  {equipement.date_mise_service}
                </Text>
              </Flex>
            )}
            <Flex justify="between">
              <Text size="2" color="gray">
                Équipement mère
              </Text>
              <Text size="2" weight="medium">
                {equipement.is_mere ? 'Oui' : 'Non'}
              </Text>
            </Flex>
          </Flex>
        </Box>

        {/* Notes */}
        {equipement.notes && (
          <Box>
            <Text weight="medium" size="2" mb="2">
              Notes
            </Text>
            <Text size="2" color="gray">
              {equipement.notes}
            </Text>
          </Box>
        )}
      </Flex>
    </Box>
  );
}

InfoTab.propTypes = {
  equipement: PropTypes.object,
};

function StatsTab({ stats, statsLoading }) {
  if (statsLoading) return <LoadingState message="Chargement des statistiques..." />;
  if (!stats) return <Box py="4"><Text color="gray">Aucune statistique disponible</Text></Box>;
  return (
    <Box py="4">
      <Grid columns="2" gap="3">
        <Card style={{ padding: '1.5rem' }}>
          <Text weight="medium" size="1" color="gray" mb="3">Interventions</Text>
          <Grid columns="2" gap="2">
            <Box>
              <Text size="3" weight="medium" color="orange">{stats.interventions?.open || 0}</Text>
              <Text size="1" color="gray">Ouvertes</Text>
            </Box>
            <Box>
              <Text size="3" weight="medium" color="green">{stats.interventions?.closed || 0}</Text>
              <Text size="1" color="gray">Fermées</Text>
            </Box>
          </Grid>
        </Card>
        {stats.interventions?.by_priority && (
          <Card style={{ padding: '1.5rem' }}>
            <Text weight="medium" size="1" color="gray" mb="3">Par priorité</Text>
            <Flex direction="column" gap="2">
              {Object.entries(stats.interventions.by_priority).map(([priority, count]) => (
                <Flex key={priority} justify="between">
                  <Text size="2" capitalize>{priority}</Text>
                  <Text weight="medium">{count}</Text>
                </Flex>
              ))}
            </Flex>
          </Card>
        )}
      </Grid>
    </Box>
  );
}

StatsTab.propTypes = {
  stats: PropTypes.object,
  statsLoading: PropTypes.bool,
};

export default function EquipementDetailTab({ id }) {
  const [activeTab, setActiveTab] = useState('info');
  const { equipement, loading, error, health, stats, statsLoading, interventions, childrenCount, parentId } =
    useEquipementDetail(id);

  if (error) return <ErrorState error={error} />;
  if (loading && !equipement) return <LoadingState message="Chargement de l'équipement..." />;

  const tabs = buildTabs(childrenCount, interventions?.total || 0);

  return (
    <Box>
      <EquipementInfoBanner equipement={equipement} health={health} parentId={parentId} />

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
          <InfoTab equipement={equipement} />
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
          <StatsTab stats={stats} statsLoading={statsLoading} />
        </Tabs.Content>
      </Tabs.Root>
    </Box>
  );
}

EquipementDetailTab.propTypes = {
  id: PropTypes.string.isRequired,
};
