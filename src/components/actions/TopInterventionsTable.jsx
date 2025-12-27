import { Link } from "react-router-dom";
import { Box, Flex, Text, Table, Badge } from "@radix-ui/themes";
import { Repeat2, TrendingUp } from "lucide-react";
import { AnalysisHeader, AdviceCallout } from "../common/AnalysisComponents";
import EmptyState from "../common/EmptyState";

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
            const recurrenceScore = interv.recurrenceScore ?? 0;
            const avgComplexity = parseFloat(interv.avgComplexity) || 0;
            const avgTime = interv.avgTime ?? 0;
            const totalTime = interv.totalTime ?? 0;

            // Déterminer le statut
            let statusBadge, statusColor;
            if (index < 5) {
              statusBadge = "🔴 Critique";
              statusColor = "red";
            } else if (index < 10) {
              statusBadge = "⚠️ Attention";
              statusColor = "orange";
            } else {
              statusBadge = "✓ Normal";
              statusColor = "green";
            }

            return (
              <Table.Row 
                key={interv.id}
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
                    <Link to={`/intervention/${interv.id}`} style={{ textDecoration: 'none' }}>
                      <Text weight="bold" size="2" style={{ color: 'var(--blue-11)' }}>
                        {interv.code || `INT-${interv.id}`}
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
                      title={interv.title}
                    >
                      {interv.title || "Sans titre"}
                    </Text>
                  </Flex>
                </Table.Cell>
                <Table.Cell style={{ textAlign: "center" }}>
                  <Badge color="blue" size="1">{interv.actionCount || 0}</Badge>
                </Table.Cell>
                <Table.Cell style={{ textAlign: "center" }}>
                  <Badge color="purple" size="1">{interv.categoryCount || 0}</Badge>
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
                  <Badge color={statusColor} size="1">{statusBadge}</Badge>
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
            "Statut critique (🔴) : Planifier une maintenance préventive approfondie",
            "Score élevé : Intervention consommant beaucoup de ressources, prioriser l'optimisation",
            "Haute diversité : Problème systémique possible, analyser les causes racines"
          ]}
        />
      </Flex>
    </Box>
  );
}