/**
 * @fileoverview Onglet stats d'un équipement
 * @module components/equipements/EquipementStatsTab
 */

import { Box, Flex, Card, Text, Badge, Heading } from '@radix-ui/themes';
import ErrorDisplay from '@/components/ErrorDisplay';

export default function EquipementStatsTab({ stats, error }) {
  if (error) return <ErrorDisplay error={error} />;
  if (!stats) return null;

  return (
    <Flex direction="column" gap="4">
      <Card>
        <Heading size="4" mb="3">Interventions</Heading>
        <Flex gap="4" mb="4">
          <Box>
            <Text size="1" color="gray">Ouvertes</Text>
            <Text size="4" weight="bold">{stats.interventions.open}</Text>
          </Box>
          <Box>
            <Text size="1" color="gray">Fermées</Text>
            <Text size="4" weight="bold">{stats.interventions.closed}</Text>
          </Box>
        </Flex>
      </Card>
      {Object.keys(stats.interventions.byPriority).length > 0 && (
        <Card>
          <Heading size="4" mb="3">Par priorité</Heading>
          <Flex direction="column" gap="2">
            {Object.entries(stats.interventions.byPriority).map(([priority, count]) => (
              <Flex key={priority} justify="between">
                <Text size="2">{priority}</Text>
                <Badge>{count}</Badge>
              </Flex>
            ))}
          </Flex>
        </Card>
      )}
    </Flex>
  );
}
