/**
 * @fileoverview Onglets de la page détail équipement
 * @module components/equipements/EquipementDetailTabs
 */

import { Box, Text, Tabs } from '@radix-ui/themes';
import ErrorDisplay from '@/components/ErrorDisplay';
import LoadingState from '@/components/common/LoadingState';
import EquipementHierarchy from '@/components/common/EquipementHierarchy';
import EquipementStatsTab from '@/components/equipements/EquipementStatsTab';
import OpenInterventionsTable from '@/components/machine/OpenInterventionsTable';

function InterventionsContent({ interventions, intLoading, intError, machineId }) {
  if (intLoading && !interventions.length) {
    return <LoadingState message="Chargement des interventions..." fullscreen={false} />;
  }
  if (intError) return <ErrorDisplay error={intError} />;
  return <OpenInterventionsTable interventions={interventions} machineId={machineId} />;
}

function HierarchyContent({ parentInfo, childrenInfo }) {
  return (
    <>
      <EquipementHierarchy parentInfo={parentInfo} childrenInfo={childrenInfo} />
      {!parentInfo && childrenInfo.length === 0 && (
        <Text color="gray">Aucun équipement parent ou enfant</Text>
      )}
    </>
  );
}

function StatsContent({ stats, statsLoading, statsError }) {
  if (statsLoading && !stats) {
    return <LoadingState message="Chargement des statistiques..." fullscreen={false} />;
  }
  return <EquipementStatsTab stats={stats} error={statsError} />;
}

export default function EquipementDetailTabs({ detail }) {
  const { interventions, intLoading, intError, stats, statsLoading, statsError,
    parentInfo, childrenInfo, activeTab, setActiveTab, machineId } = detail;

  return (
    <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
      <Tabs.List>
        <Tabs.Trigger value="interventions">Interventions ({interventions.length})</Tabs.Trigger>
        <Tabs.Trigger value="hierarchy">Hiérarchie</Tabs.Trigger>
        <Tabs.Trigger value="stats">Stats</Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="interventions">
        <Box py="4">
          <InterventionsContent
            interventions={interventions}
            intLoading={intLoading}
            intError={intError}
            machineId={machineId}
          />
        </Box>
      </Tabs.Content>

      <Tabs.Content value="hierarchy">
        <Box py="4">
          <HierarchyContent parentInfo={parentInfo} childrenInfo={childrenInfo} />
        </Box>
      </Tabs.Content>

      <Tabs.Content value="stats">
        <Box py="4">
          <StatsContent stats={stats} statsLoading={statsLoading} statsError={statsError} />
        </Box>
      </Tabs.Content>
    </Tabs.Root>
  );
}
