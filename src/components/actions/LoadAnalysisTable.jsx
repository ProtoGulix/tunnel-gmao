import { Box, Flex, Text, Table, Badge } from "@radix-ui/themes";
import { Zap, TrendingUp } from "lucide-react";
import { AnalysisHeader, AdviceCallout } from "@/components/common/AnalysisComponents";
import EmptyState from "@/components/common/EmptyState";

/**
 * Tableau d'analyse de charge des catégories
 * Identifie les catégories les plus récurrentes et chronophages
 */
export default function LoadAnalysisTable({ 
  categories, 
  getComplexityBadge, 
  getLoadPriorityBadge 
}) {
  // ==================== RENDER: EMPTY STATE ====================
  if (!categories || categories.length === 0) {
    return (
      <EmptyState
        icon={Zap}
        title="Aucune donnée disponible"
        description="L'analyse de charge des catégories apparaîtra ici"
      />
    );
  }

  // ==================== RENDER: MAIN VIEW ====================
  return (
    <Box p="0">
      {/* En-tête */}
      <AnalysisHeader
        icon={Zap}
        title="Analyse de charge - Catégories prioritaires"
        description="Catégories générant le plus de charge (occurrences × temps total). Les 3 premières nécessitent une attention prioritaire."
      />

      {/* Tableau */}
      <Table.Root variant="surface" size="1">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell style={{ width: "60px" }}>Priorité</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Catégorie</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Sous-catégorie</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell style={{ textAlign: "center" }}>Occurrences</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell style={{ textAlign: "center" }}>Interventions</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell style={{ textAlign: "right" }}>Temps moy.</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell style={{ textAlign: "right" }}>Complexité moy.</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell style={{ textAlign: "right" }}>Temps total</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell style={{ textAlign: "right" }}>Score charge</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {categories.map((cat, index) => (
            <Table.Row 
              key={index}
              style={{ 
                background: index < 3 ? "var(--red-2)" : "transparent",
              }}
            >
              <Table.Cell>
                <Badge color={getLoadPriorityBadge(index).color} size="1">
                  #{index + 1}
                </Badge>
              </Table.Cell>
              <Table.Cell>
                <Text size="2">{cat.category}</Text>
              </Table.Cell>
              <Table.Cell>
                <Flex align="center" gap="1">
                  {cat.code && (
                    <Text weight="bold" size="2">{cat.code}</Text>
                  )}
                  <Text size="2">{cat.subcategory}</Text>
                </Flex>
              </Table.Cell>
              <Table.Cell style={{ textAlign: "center" }}>
                <Badge color="blue" size="1">{cat.count}×</Badge>
              </Table.Cell>
              <Table.Cell style={{ textAlign: "center" }}>
                <Text size="2">{cat.interventionCount}</Text>
              </Table.Cell>
              <Table.Cell style={{ textAlign: "right" }}>
                <Text size="2" style={{ fontFamily: "monospace" }}>
                  {cat.avgTime}h
                </Text>
              </Table.Cell>
              <Table.Cell style={{ textAlign: "right" }}>
                <Badge color={getComplexityBadge(parseFloat(cat.avgComplexity)).color} size="1">
                  {cat.avgComplexity}/10
                </Badge>
              </Table.Cell>
              <Table.Cell style={{ textAlign: "right" }}>
                <Text weight="bold" size="2" style={{ fontFamily: "monospace" }}>
                  {cat.totalTime.toFixed(2)}h
                </Text>
              </Table.Cell>
              <Table.Cell style={{ textAlign: "right" }}>
                <Text weight="bold" size="2" color="red" style={{ fontFamily: "monospace" }}>
                  {cat.loadScore.toFixed(2)}
                </Text>
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>

      {/* Conseil */}
      <Flex direction="column" gap="2" style={{ marginTop: '16px' }}>
        <AdviceCallout
          type="recommendations"
          title="Conseil :"
          items={[
            "Les catégories en rouge ont le score de charge le plus élevé (occurrences × temps total)",
            "Ce sont les actions les plus récurrentes ET les plus chronophages",
            "Envisagez des actions préventives pour réduire leur fréquence"
          ]}
        />
      </Flex>
    </Box>
  );
}