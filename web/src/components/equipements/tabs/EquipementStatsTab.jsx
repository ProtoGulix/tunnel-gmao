import { Box, Card, Flex, Grid, Text } from '@radix-ui/themes';
import PropTypes from 'prop-types';
import LoadingState from '@/components/ui/LoadingState';

export default function EquipementStatsTab({ stats, statsLoading }) {
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

EquipementStatsTab.propTypes = {
  stats: PropTypes.object,
  statsLoading: PropTypes.bool,
};
