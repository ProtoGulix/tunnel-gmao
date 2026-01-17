import { Link } from "react-router-dom";
import { Flex, Text, Table, Badge } from "@radix-ui/themes";
import EmptyState from "@/components/common/EmptyState";
import { stripHtml } from "@/lib/utils/htmlUtils";
import { 
  formatActionDate, 
  formatTime, 
  getComplexityBadge,
  getCategoryColor
} from "@/lib/utils/actionUtils";
import { 
  getActionCreatedAt,
  getActionDescription,
  getActionComplexityScore,
  getActionTimeSpent,
  getInterventionId,
  getInterventionCode,
  getInterventionTitle,
  getSubcategoryCode,
  getSubcategoryName,
  getTechnicianFirstName,
  getTechnicianLastName
} from "./actionsListUtils";
import { actionTableRowPropTypes, actionsListTablePropTypes } from "./ActionsListTableProps";

/**
 * Tableau des actions ou état vide
 * 
 * Contraintes respectées :
 * - 2 props (actions, emptyState)
 * - Extraction de données via fonctions pures
 * - Pas de logique complexe dans le JSX
 */
export default function ActionsListTable({ actions, emptyState }) {
  // Early return si aucune action
  if (!actions || actions.length === 0) {
    return (
      <EmptyState
        icon={emptyState.icon}
        title={emptyState.title}
        description={emptyState.description}
      />
    );
  }

  // ==================== RENDER ====================

  return (
    <Table.Root variant="surface" size="1">
      <Table.Header>
        <Table.Row>
          <Table.ColumnHeaderCell>Date</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Intervention</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Catégorie</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell style={{ textAlign: 'center' }}>
            Complexité
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell style={{ textAlign: 'right' }}>
            Temps
          </Table.ColumnHeaderCell>
          <Table.ColumnHeaderCell>Technicien</Table.ColumnHeaderCell>
        </Table.Row>
      </Table.Header>
      <Table.Body>
        {actions.map((action) => (
          <ActionTableRow key={action.id} action={action} />
        ))}
      </Table.Body>
    </Table.Root>
  );
}

/**
 * Ligne de tableau pour une action
 * Séparée pour réduire la complexité du composant parent
 */
function ActionTableRow({ action }) {
  // Extraction des données
  const complexity = getActionComplexityScore(action);
  const complexityBadge = getComplexityBadge(complexity);
  const ComplexityIcon = complexityBadge.icon;
  const subcategory = action.action_subcategory ?? action.subcategory;
  const categoryColor = getCategoryColor(subcategory);
  const timeSpent = getActionTimeSpent(action);
  const createdAt = getActionCreatedAt(action);
  const description = getActionDescription(action);
  const intervention = action.intervention_id ?? action.intervention;
  const technician = action.tech ?? action.technician;

  return (
    <Table.Row>
      {/* Date */}
      <Table.Cell>
        <Text size="2" style={{ fontFamily: 'monospace' }}>
          {formatActionDate(createdAt)}
        </Text>
      </Table.Cell>

      {/* Intervention */}
      <Table.Cell>
        {intervention ? (
          <Link 
            to={`/intervention/${getInterventionId(intervention)}`}
            style={{ textDecoration: 'none' }}
          >
            <Flex direction="column" gap="1">
              <Text size="2" weight="bold" color="blue">
                {getInterventionCode(intervention)}
              </Text>
              <Text 
                size="1" 
                color="gray"
                style={{ 
                  display: '-webkit-box',
                  WebkitLineClamp: 1,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}
              >
                {getInterventionTitle(intervention)}
              </Text>
            </Flex>
          </Link>
        ) : (
          <Text size="2" color="gray">—</Text>
        )}
      </Table.Cell>

      {/* Catégorie */}
      <Table.Cell>
        <Flex direction="column" gap="1">
          <Badge 
            size="1" 
            style={{ 
              backgroundColor: categoryColor || '#6b7280',
              color: 'white'
            }}
          >
            {getSubcategoryCode(subcategory)}
          </Badge>
          <Text size="1" color="gray">
            {getSubcategoryName(subcategory)}
          </Text>
        </Flex>
      </Table.Cell>

      {/* Description */}
      <Table.Cell style={{ maxWidth: '300px' }}>
        <Text 
          size="2"
          style={{ 
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
          title={stripHtml(description)}
        >
          {stripHtml(description) || '—'}
        </Text>
      </Table.Cell>

      {/* Complexité */}
      <Table.Cell style={{ textAlign: 'center' }}>
        <Badge color={complexityBadge.color} size="1" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <ComplexityIcon size={12} />
          {complexity}/10
        </Badge>
      </Table.Cell>

      {/* Temps */}
      <Table.Cell style={{ textAlign: 'right' }}>
        <Text size="2" weight="bold" style={{ fontFamily: 'monospace' }}>
          {formatTime(timeSpent)}
        </Text>
      </Table.Cell>

      {/* Technicien */}
      <Table.Cell>
        {technician ? (
          <Text size="2">
            {getTechnicianFirstName(technician)} {getTechnicianLastName(technician)}
          </Text>
        ) : (
          <Text size="2" color="gray">—</Text>
        )}
      </Table.Cell>
    </Table.Row>
  );
}

// ==================== PROPTYPES ====================

ActionTableRow.propTypes = actionTableRowPropTypes;

ActionsListTable.displayName = "ActionsListTable";

ActionsListTable.propTypes = actionsListTablePropTypes;
