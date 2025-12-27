import { useState } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { Box, Flex, Text, Table, Badge, Button, TextField } from "@radix-ui/themes";
import { Search, List } from "lucide-react";
import { AnalysisHeader } from "@/components/common/AnalysisComponents";
import EmptyState from "@/components/common/EmptyState";
import { 
  formatActionDate, 
  formatTime, 
  getComplexityBadge,
  getCategoryBadge 
} from "@/lib/utils/actionUtils";

// DTO-friendly accessors with legacy fallback
const getActionCreatedAt = (action) => action?.createdAt ?? action?.created_at ?? null;
const getActionDescription = (action) => action?.description ?? "";
const getActionComplexityScore = (action) => Number(action?.complexityScore ?? action?.complexity_score ?? 0);
const getActionTimeSpent = (action) => Number(action?.timeSpent ?? action?.time_spent ?? 0);
const getInterventionId = (intervention) => intervention?.id ?? null;
const getInterventionCode = (intervention) => intervention?.code ?? "—";
const getInterventionTitle = (intervention) => intervention?.title ?? "—";
const getSubcategoryCode = (subcategory) => subcategory?.code ?? "—";
const getSubcategoryName = (subcategory) => subcategory?.name ?? "—";
const getTechnicianFirstName = (technician) => technician?.firstName ?? technician?.first_name ?? "—";
const getTechnicianLastName = (technician) => technician?.lastName ?? technician?.last_name ?? "—";

/**
 * Liste complète des actions avec filtres
 */
// eslint-disable-next-line no-unused-vars
export default function ActionsList({ actions, onDateRangeChange }) {
  // Note: onDateRangeChange is part of the public API for future date filtering functionality
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);

  // ==================== COMPUTED VALUES ====================

  // Filtrage des actions
  const filteredActions = (actions || []).filter(action => {
    const matchSearch = !searchTerm || 
      getActionDescription(action).toLowerCase().includes(searchTerm.toLowerCase()) ||
      (action.intervention_id?.code ?? action.intervention?.code ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (action.action_subcategory?.name ?? action.subcategory?.name ?? "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory = !selectedCategory || 
      (action.action_subcategory?.code ?? action.subcategory?.code) === selectedCategory;

    return matchSearch && matchCategory;
  });

  // Extraction des catégories uniques
  const categories = [...new Set((actions || []).map(a => a.action_subcategory?.code ?? a.subcategory?.code).filter(Boolean))];

  // ==================== RENDER ====================

  return (
    <Box p="0">
      {/* En-tête */}
      <AnalysisHeader
        icon={List}
        title="Liste des actions"
        description="Toutes les actions enregistrées avec filtres par catégorie et recherche."
      />

      {/* Filtres */}
      <Flex gap="3" mb="3" wrap="wrap">
        <Box style={{ flex: 1, minWidth: '250px' }}>
          <TextField.Root
            placeholder="Rechercher une action, intervention, catégorie..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="2"
          >
            <TextField.Slot>
              <Search size={16} />
            </TextField.Slot>
          </TextField.Root>
        </Box>

        {/* Boutons de filtrage par catégorie */}
        <Flex gap="2" wrap="wrap">
          <Button
            size="1"
            variant={selectedCategory === null ? "solid" : "soft"}
            onClick={() => setSelectedCategory(null)}
          >
            Toutes ({actions?.length || 0})
          </Button>
          {categories.slice(0, 5).map(cat => {
            const count = (actions || []).filter(a => (a.action_subcategory?.code ?? a.subcategory?.code) === cat).length;
            return (
              <Button
                key={cat}
                size="1"
                variant={selectedCategory === cat ? "solid" : "soft"}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat} ({count})
              </Button>
            );
          })}
        </Flex>
      </Flex>

      {/* Résultats */}
      <Text size="2" color="gray" style={{ display: 'block', marginBottom: '12px' }}>
        {filteredActions.length} action{filteredActions.length > 1 ? 's' : ''} trouvée{filteredActions.length > 1 ? 's' : ''}
      </Text>

      {/* Tableau ou état vide */}
      {filteredActions.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="Aucune action trouvée"
          description="Ajustez vos filtres pour voir les résultats"
        />
      ) : (
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
            {filteredActions.map((action) => {
              const complexity = getActionComplexityScore(action);
              const complexityBadge = getComplexityBadge(complexity);
              const categoryBadge = getCategoryBadge(getSubcategoryCode(action.action_subcategory ?? action.subcategory));
              const timeSpent = getActionTimeSpent(action);
              const createdAt = getActionCreatedAt(action);
              const description = getActionDescription(action);
              const intervention = action.intervention_id ?? action.intervention;
              const subcategory = action.action_subcategory ?? action.subcategory;
              const technician = action.tech ?? action.technician;

              return (
                <Table.Row key={action.id}>
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
                      <Badge color={categoryBadge.color} size="1">
                        {categoryBadge.icon} {getSubcategoryCode(subcategory)}
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
                      title={description}
                    >
                      {description || '—'}
                    </Text>
                  </Table.Cell>

                  {/* Complexité */}
                  <Table.Cell style={{ textAlign: 'center' }}>
                    <Badge color={complexityBadge.color} size="1">
                      {complexityBadge.icon} {complexity}/10
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
            })}
          </Table.Body>
        </Table.Root>
      )}
    </Box>
  );
}

ActionsList.displayName = "ActionsList";

ActionsList.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      description: PropTypes.string,
      created_at: PropTypes.string,
      createdAt: PropTypes.string,
      complexity_score: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      complexityScore: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      time_spent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      timeSpent: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      intervention_id: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        code: PropTypes.string,
        title: PropTypes.string
      }),
      intervention: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        code: PropTypes.string,
        title: PropTypes.string
      }),
      action_subcategory: PropTypes.shape({
        code: PropTypes.string,
        name: PropTypes.string
      }),
      subcategory: PropTypes.shape({
        code: PropTypes.string,
        name: PropTypes.string
      }),
      tech: PropTypes.shape({
        first_name: PropTypes.string,
        last_name: PropTypes.string
      }),
      technician: PropTypes.shape({
        firstName: PropTypes.string,
        first_name: PropTypes.string,
        lastName: PropTypes.string,
        last_name: PropTypes.string
      })
    })
  ),
  onDateRangeChange: PropTypes.func
};