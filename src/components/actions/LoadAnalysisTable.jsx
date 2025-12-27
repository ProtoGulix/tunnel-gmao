import { Box, Flex, Text, Table, Badge } from "@radix-ui/themes";
import PropTypes from "prop-types";
import { Zap } from "lucide-react";
import { AnalysisHeader, AdviceCallout } from "@/components/common/AnalysisComponents";
import EmptyState from "@/components/common/EmptyState";

// ============================================================================
// DTO ACCESSORS
// ============================================================================

/**
 * Safe accessors for category object fields
 */
const getCategoryName = (cat) => cat?.category ?? cat?.Category ?? '';
const getSubcategoryName = (cat) => cat?.subcategory ?? cat?.subcategory_name ?? cat?.Subcategory ?? '';
const getCode = (cat) => cat?.code ?? cat?.Code ?? '';
const getCount = (cat) => {
  const value = cat?.count ?? cat?.Count ?? 0;
  return typeof value === 'number' ? value : Number(value) || 0;
};
const getInterventionCount = (cat) => {
  const value = cat?.interventionCount ?? cat?.intervention_count ?? cat?.InterventionCount ?? 0;
  return typeof value === 'number' ? value : Number(value) || 0;
};
const getAvgTime = (cat) => {
  const value = cat?.avgTime ?? cat?.avg_time ?? cat?.AvgTime ?? 0;
  return typeof value === 'number' ? value : Number(value) || 0;
};
const getAvgComplexity = (cat) => {
  const value = cat?.avgComplexity ?? cat?.avg_complexity ?? cat?.AvgComplexity ?? 0;
  return typeof value === 'number' ? value : Number(value) || 0;
};
const getTotalTime = (cat) => {
  const value = cat?.totalTime ?? cat?.total_time ?? cat?.TotalTime ?? 0;
  return typeof value === 'number' ? value : Number(value) || 0;
};
const getLoadScore = (cat) => {
  const value = cat?.loadScore ?? cat?.load_score ?? cat?.LoadScore ?? 0;
  return typeof value === 'number' ? value : Number(value) || 0;
};

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
          {categories.map((cat, index) => {
            // ----- Computed Values -----
            const categoryName = getCategoryName(cat);
            const subcategoryName = getSubcategoryName(cat);
            const code = getCode(cat);
            const count = getCount(cat);
            const interventionCount = getInterventionCount(cat);
            const avgTime = getAvgTime(cat);
            const avgComplexity = getAvgComplexity(cat);
            const totalTime = getTotalTime(cat);
            const loadScore = getLoadScore(cat);

            return (
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
                  <Text size="2">{categoryName}</Text>
                </Table.Cell>
                <Table.Cell>
                  <Flex align="center" gap="1">
                    {code && (
                      <Text weight="bold" size="2">{code}</Text>
                    )}
                    <Text size="2">{subcategoryName}</Text>
                  </Flex>
                </Table.Cell>
                <Table.Cell style={{ textAlign: "center" }}>
                  <Badge color="blue" size="1">{count}×</Badge>
                </Table.Cell>
                <Table.Cell style={{ textAlign: "center" }}>
                  <Text size="2">{interventionCount}</Text>
                </Table.Cell>
                <Table.Cell style={{ textAlign: "right" }}>
                  <Text size="2" style={{ fontFamily: "monospace" }}>
                    {avgTime}h
                  </Text>
                </Table.Cell>
                <Table.Cell style={{ textAlign: "right" }}>
                  <Badge color={getComplexityBadge(avgComplexity).color} size="1">
                    {avgComplexity.toFixed(2)}/10
                  </Badge>
                </Table.Cell>
                <Table.Cell style={{ textAlign: "right" }}>
                  <Text weight="bold" size="2" style={{ fontFamily: "monospace" }}>
                    {totalTime.toFixed(2)}h
                  </Text>
                </Table.Cell>
                <Table.Cell style={{ textAlign: "right" }}>
                  <Text weight="bold" size="2" color="red" style={{ fontFamily: "monospace" }}>
                    {loadScore.toFixed(2)}
                  </Text>
                </Table.Cell>
              </Table.Row>
            );
          })}
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

// ============================================================================
// PROP TYPES
// ============================================================================

LoadAnalysisTable.propTypes = {
  categories: PropTypes.arrayOf(
    PropTypes.shape({
      category: PropTypes.string,
      Category: PropTypes.string,
      subcategory: PropTypes.string,
      subcategory_name: PropTypes.string,
      Subcategory: PropTypes.string,
      code: PropTypes.string,
      Code: PropTypes.string,
      count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      Count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      interventionCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      intervention_count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      InterventionCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      avgTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      avg_time: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      AvgTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      avgComplexity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      avg_complexity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      AvgComplexity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      totalTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      total_time: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      TotalTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      loadScore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      load_score: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      LoadScore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    })
  ),
  getComplexityBadge: PropTypes.func,
  getLoadPriorityBadge: PropTypes.func,
};

LoadAnalysisTable.displayName = 'LoadAnalysisTable';