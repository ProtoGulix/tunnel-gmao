import { Grid, Card, Box, Flex, Heading, Text, Badge } from "@radix-ui/themes";
import PropTypes from "prop-types";
import { Wrench, Clock, BarChart3, AlertCircle } from "lucide-react";

// ============================================================================
// DTO ACCESSORS
// ============================================================================

/**
 * Safe accessors for stats object fields
 */
const getTotalActions = (stats) => stats?.totalActions ?? stats?.total_actions ?? 0;
const getCategoriesCount = (stats) => stats?.categoriesCount ?? stats?.categories_count ?? 0;
const getTotalTime = (stats) => stats?.totalTime ?? stats?.total_time ?? 0;
const getAvgComplexity = (stats) => {
  const value = stats?.avgComplexity ?? stats?.avg_complexity ?? 0;
  return typeof value === 'number' ? value : Number(value) || 0;
};

/**
 * Cartes de statistiques pour les actions
 */
export default function ActionStatsCards({ stats, totalAnomalies }) {
  // ----- Computed Values -----
  const totalActions = getTotalActions(stats);
  const categoriesCount = getCategoriesCount(stats);
  const totalTime = getTotalTime(stats);
  const avgComplexity = getAvgComplexity(stats);
  return (
    <Grid columns={{ initial: "1", sm: "2", md: "4" }} gap="3">
      {/* Total Actions */}
      <Card>
        <Box p="3">
          <Flex align="center" gap="2" mb="2">
            <Wrench size={20} />
            <Text size="2" color="gray">Actions totales</Text>
          </Flex>
          <Heading size="6">{totalActions}</Heading>
          <Text size="1" color="gray" style={{ marginTop: '4px' }}>
            {categoriesCount} catégories
          </Text>
        </Box>
      </Card>

      {/* Temps total */}
      <Card>
        <Box p="3">
          <Flex align="center" gap="2" mb="2">
            <Clock size={20} />
            <Text size="2" color="gray">Temps total</Text>
          </Flex>
          <Heading size="6">{totalTime}h</Heading>
          <Text size="1" color="gray" style={{ marginTop: '4px' }}>
            Temps cumulé
          </Text>
        </Box>
      </Card>

      {/* Complexité moyenne */}
      <Card>
        <Box p="3">
          <Flex align="center" gap="2" mb="2">
            <BarChart3 size={20} />
            <Text size="2" color="gray">Complexité moy.</Text>
          </Flex>
          <Flex align="baseline" gap="2">
            <Heading size="6">{avgComplexity}</Heading>
            <Text size="2" color="gray">/10</Text>
          </Flex>
          <Badge 
            color={avgComplexity >= 7 ? "red" : avgComplexity >= 5 ? "orange" : "green"}
            size="1"
            style={{ marginTop: '4px' }}
          >
            {avgComplexity >= 7 ? "Élevée" : avgComplexity >= 5 ? "Moyenne" : "Faible"}
          </Badge>
        </Box>
      </Card>

      {/* Anomalies */}
      <Card>
        <Box p="3">
          <Flex align="center" gap="2" mb="2">
            <AlertCircle size={20} />
            <Text size="2" color="gray">Anomalies</Text>
          </Flex>
          <Heading size="6" color={totalAnomalies > 0 ? "red" : "green"}>
            {totalAnomalies}
          </Heading>
          <Badge 
            color={totalAnomalies > 0 ? "red" : "green"}
            size="1"
            style={{ marginTop: '4px' }}
          >
            {totalAnomalies > 0 ? "À traiter" : "✓ Aucune"}
          </Badge>
        </Box>
      </Card>
    </Grid>
  );
}

// ============================================================================
// PROP TYPES
// ============================================================================

ActionStatsCards.propTypes = {
  stats: PropTypes.shape({
    totalActions: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    total_actions: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    categoriesCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    categories_count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    totalTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    total_time: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    avgComplexity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    avg_complexity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }),
  totalAnomalies: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

ActionStatsCards.displayName = 'ActionStatsCards';