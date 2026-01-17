import { Link } from "react-router-dom";
import { Box, Flex, Text, Table, Badge } from "@radix-ui/themes";
import PropTypes from "prop-types";
import { Repeat2, TrendingUp, CircleDot, AlertTriangle, Check } from "lucide-react";
import { AnalysisHeader, AdviceCallout } from "../common/AnalysisComponents";
import EmptyState from "../common/EmptyState";

// ============================================================================
// DTO ACCESSORS
// ============================================================================

/**
 * Safe accessors for intervention object fields
 */
const getInterventionId = (interv) => interv?.id ?? interv?.Id ?? '';
const getInterventionCode = (interv) => interv?.code ?? interv?.Code ?? '';
const getInterventionTitle = (interv) => interv?.title ?? interv?.Title ?? 'Sans titre';
const getActionCount = (interv) => {
  const value = interv?.actionCount ?? interv?.action_count ?? interv?.ActionCount ?? 0;
  return typeof value === 'number' ? value : Number(value) || 0;
};
const getCategoryCount = (interv) => {
  const value = interv?.categoryCount ?? interv?.category_count ?? interv?.CategoryCount ?? 0;
  return typeof value === 'number' ? value : Number(value) || 0;
};
const getTotalTime = (interv) => {
  const value = interv?.totalTime ?? interv?.total_time ?? interv?.TotalTime ?? 0;
  return typeof value === 'number' ? value : Number(value) || 0;
};
const getAvgTime = (interv) => {
  const value = interv?.avgTime ?? interv?.avg_time ?? interv?.AvgTime ?? 0;
  return typeof value === 'number' ? value : Number(value) || 0;
};
const getAvgComplexity = (interv) => {
  const value = interv?.avgComplexity ?? interv?.avg_complexity ?? interv?.AvgComplexity ?? 0;
  return typeof value === 'number' ? value : Number(value) || 0;
};
const getRecurrenceScore = (interv) => {
  const value = interv?.recurrenceScore ?? interv?.recurrence_score ?? interv?.RecurrenceScore ?? 0;
  return typeof value === 'number' ? value : Number(value) || 0;
};

/**
 * Tableau des interventions les plus récurrentes
 * Permet d'identifier les machines/équipements nécessitant le plus d'actions
 */
export default function TopInterventionsTable({ 
  interventions, 
  getComplexityBadge, 
  getRecurrenceBadge 
}) {
  // ==================== RENDER: EMPTY STATE ====================
  if (!interventions || interventions.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="Aucune donnée disponible"
        description="Les interventions récurrentes apparaîtront ici"
      />
    );
  }

  // ==================== RENDER: MAIN VIEW ====================
  return (
    <Box p="0">
      {/* En-tête */}
      <AnalysisHeader
        icon={Repeat2}
        title="Interventions récurrentes - Analyse détaillée"
        description="Interventions générant le plus de charge (occurrences × temps total). Identifiez les équipements nécessitant une maintenance préventive."
      />

      {/* Tableau */}
      <Table.Root variant="surface" size="1">
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell style={{ width: "60px" }}>Rang</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell>Intervention</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell style={{ textAlign: "center" }}>Actions</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell style={{ textAlign: "center" }}>Catégories</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell style={{ textAlign: "right" }}>Temps total</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell style={{ textAlign: "right" }}>Temps moy.</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell style={{ textAlign: "right" }}>Complexité moy.</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell style={{ textAlign: "right" }}>Score charge</Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell style={{ textAlign: "center" }}>Statut</Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {interventions.map((interv, index) => {
            // ----- Computed Values -----
            const id = getInterventionId(interv);
            const code = getInterventionCode(interv);
            const title = getInterventionTitle(interv);
            const actionCount = getActionCount(interv);
            const categoryCount = getCategoryCount(interv);
            const totalTime = getTotalTime(interv);
            const avgTime = getAvgTime(interv);
            const avgComplexity = getAvgComplexity(interv);
            const recurrenceScore = getRecurrenceScore(interv);

            // Déterminer le statut
            let statusBadge, statusColor, StatusIcon;
            if (index < 5) {
              statusBadge = "Critique";
              statusColor = "red";
              StatusIcon = CircleDot;
            } else if (index < 10) {
              statusBadge = "Attention";
              statusColor = "orange";
              StatusIcon = AlertTriangle;
            } else {
              statusBadge = "Normal";
              statusColor = "green";
              StatusIcon = Check;
            }

            return (
              <Table.Row 
                key={id}
                style={{ 
                  background: index < 5 ? "var(--orange-2)" : "transparent",
                }}
              >
                <Table.Cell>
                  <Badge color={getRecurrenceBadge(index).color} size="1">
                    #{index + 1}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Flex direction="column" gap="1">
                    <Link to={`/intervention/${id}`} style={{ textDecoration: 'none' }}>
                      <Text weight="bold" size="2" style={{ color: 'var(--blue-11)' }}>
                        {code || `INT-${id}`}
                      </Text>
                    </Link>
                    <Text 
                      size="1" 
                      color="gray"
                      style={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 1,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}
                      title={title}
                    >
                      {title}
                    </Text>
                  </Flex>
                </Table.Cell>
                <Table.Cell style={{ textAlign: "center" }}>
                  <Badge color="blue" size="1">{actionCount}</Badge>
                </Table.Cell>
                <Table.Cell style={{ textAlign: "center" }}>
                  <Badge color="purple" size="1">{categoryCount}</Badge>
                </Table.Cell>
                <Table.Cell style={{ textAlign: "right" }}>
                  <Text weight="bold" size="2" style={{ fontFamily: "monospace" }}>
                    {totalTime.toFixed(2)}h
                  </Text>
                </Table.Cell>
                <Table.Cell style={{ textAlign: "right" }}>
                  <Text size="2" style={{ fontFamily: "monospace" }}>
                    {avgTime.toFixed(2)}h
                  </Text>
                </Table.Cell>
                <Table.Cell style={{ textAlign: "right" }}>
                  <Badge color={getComplexityBadge(avgComplexity).color} size="1">
                    {avgComplexity.toFixed(1)}/10
                  </Badge>
                </Table.Cell>
                <Table.Cell style={{ textAlign: "right" }}>
                  <Text weight="bold" size="2" color="red" style={{ fontFamily: "monospace" }}>
                    {recurrenceScore.toFixed(2)}
                  </Text>
                </Table.Cell>
                <Table.Cell style={{ textAlign: "center" }}>
                  <Badge 
                    color={statusColor} 
                    size="1"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <StatusIcon size={12} />
                    {statusBadge}
                  </Badge>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table.Root>

      {/* Conseils et légende */}
      <Flex direction="column" gap="2" style={{ marginTop: '16px' }}>
        <AdviceCallout
          type="indicators"
          title="Indicateurs :"
          items={[
            "Actions : Nombre total d'actions sur cette intervention",
            "Catégories : Nombre de types d'actions différents (diversité des problèmes)",
            "Score de charge : Actions × Temps total (impact cumulé sur les ressources)"
          ]}
        />

        <AdviceCallout
          type="recommendations"
          title="Recommandations :"
          items={[
            "Statut critique : Planifier une maintenance préventive approfondie",
            "Score élevé : Intervention consommant beaucoup de ressources, prioriser l'optimisation",
            "Haute diversité : Problème systémique possible, analyser les causes racines"
          ]}
        />
      </Flex>
    </Box>
  );
}

// ============================================================================
// PROP TYPES
// ============================================================================

TopInterventionsTable.propTypes = {
  interventions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      Id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      code: PropTypes.string,
      Code: PropTypes.string,
      title: PropTypes.string,
      Title: PropTypes.string,
      actionCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      action_count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      ActionCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      categoryCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      category_count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      CategoryCount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      totalTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      total_time: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      TotalTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      avgTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      avg_time: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      AvgTime: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      avgComplexity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      avg_complexity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      AvgComplexity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      recurrenceScore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      recurrence_score: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      RecurrenceScore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    })
  ),
  getComplexityBadge: PropTypes.func,
  getRecurrenceBadge: PropTypes.func,
};

TopInterventionsTable.displayName = 'TopInterventionsTable';