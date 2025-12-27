import { useState } from "react";
import { Link } from "react-router-dom";
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

/**
 * Liste complète des actions avec filtres
 */
export default function ActionsList({ actions, onDateRangeChange }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);

  // ==================== COMPUTED VALUES ====================

  // Filtrage des actions
  const filteredActions = (actions || []).filter(action => {
    const matchSearch = !searchTerm || 
      (action.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (action.intervention_id?.code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (action.action_subcategory?.name || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory = !selectedCategory || 
      action.action_subcategory?.code === selectedCategory;

    return matchSearch && matchCategory;
  });

  // Extraction des catégories uniques
  const categories = [...new Set((actions || []).map(a => a.action_subcategory?.code).filter(Boolean))];

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
            const count = (actions || []).filter(a => a.action_subcategory?.code === cat).length;
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
              const complexity = parseInt(action.complexity_score) || 0;
              const complexityBadge = getComplexityBadge(complexity);
              const categoryBadge = getCategoryBadge(action.action_subcategory?.code);
              const timeSpent = parseFloat(action.time_spent) || 0;

              return (
                <Table.Row key={action.id}>
                  {/* Date */}
                  <Table.Cell>
                    <Text size="2" style={{ fontFamily: 'monospace' }}>
                      {formatActionDate(action.created_at)}
                    </Text>
                  </Table.Cell>

                  {/* Intervention */}
                  <Table.Cell>
                    {action.intervention_id ? (
                      <Link 
                        to={`/intervention/${action.intervention_id.id}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <Flex direction="column" gap="1">
                          <Text size="2" weight="bold" color="blue">
                            {action.intervention_id.code}
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
                            {action.intervention_id.title}
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
                        {categoryBadge.icon} {action.action_subcategory?.code || 'N/A'}
                      </Badge>
                      <Text size="1" color="gray">
                        {action.action_subcategory?.name || 'N/A'}
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
                      title={action.description}
                    >
                      {action.description || '—'}
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
                    {action.tech ? (
                      <Text size="2">
                        {action.tech.first_name} {action.tech.last_name}
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