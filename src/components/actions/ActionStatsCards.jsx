import { Grid, Card, Box, Flex, Heading, Text, Badge } from "@radix-ui/themes";
import { Wrench, Clock, BarChart3, AlertCircle } from "lucide-react";

/**
 * Cartes de statistiques pour les actions
 */
export default function ActionStatsCards({ stats, totalAnomalies }) {
  return (
    <Grid columns={{ initial: "1", sm: "2", md: "4" }} gap="3">
      {/* Total Actions */}
      <Card>
        <Box p="3">
          <Flex align="center" gap="2" mb="2">
            <Wrench size={20} />
            <Text size="2" color="gray">Actions totales</Text>
          </Flex>
          <Heading size="6">{stats.totalActions}</Heading>
          <Text size="1" color="gray" style={{ marginTop: '4px' }}>
            {stats.categoriesCount} catégories
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
          <Heading size="6">{stats.totalTime}h</Heading>
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
            <Heading size="6">{stats.avgComplexity}</Heading>
            <Text size="2" color="gray">/10</Text>
          </Flex>
          <Badge 
            color={stats.avgComplexity >= 7 ? "red" : stats.avgComplexity >= 5 ? "orange" : "green"}
            size="1"
            style={{ marginTop: '4px' }}
          >
            {stats.avgComplexity >= 7 ? "Élevée" : stats.avgComplexity >= 5 ? "Moyenne" : "Faible"}
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