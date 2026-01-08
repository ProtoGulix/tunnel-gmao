/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📋 OpenInterventionsTable.jsx - Tableau interventions ouvertes machine
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Composant affichant liste des interventions ouvertes pour une machine:
 * - Table 8 colonnes (code, titre, type, priorité, statut, date, durée, actions)
 * - Tri automatique par priorité (urgente → faible) + tri colonnes cliquable
 * - Badges colorés selon configs + badge retard si >7j
 * - Filtrage inline recherche code/titre
 * - Pagination si >10 interventions
 * - Highlight ligne urgente (background red/orange)
 * - Navigation vers détail intervention (code cliquable + bouton)
 * - Empty state styled avec message et icône
 * 
 * Configuration:
 * - INTERVENTION_TYPES: types et couleurs (COR, PRE, AME, etc.)
 * - STATUS_CONFIG: statuts et couleurs (open, in_progress, etc.)
 * - PRIORITY_CONFIG: priorités et couleurs (urgent, high, medium, low)
 * 
 * ✅ IMPLÉMENTÉ:
 * - Table.Root variant="surface" size="1" responsive
 * - Header avec compteur interventions + lien "Voir toutes"
 * - Tri par priorité décroissant (urgent → low)
 * - Badge type avec color selon INTERVENTION_TYPES
 * - Badge priorité avec color selon PRIORITY_CONFIG
 * - Badge statut avec color selon STATUS_CONFIG
 * - Formatage date fr-FR (toLocaleDateString)
 * - Code cliquable blue + Button "Voir" vers détail
 * - Durée ouverture calculée (reported_date → aujourd'hui)
 * - Protection données nulles (|| "N/A", || "Sans titre")
 * - ✅ Badge retard: >7j=orange, >14j=red (alerte visuelle)
 * - ✅ Highlight ligne urgente: background red/orange subtil
 * - ✅ Empty state styled: Card message + icône AlertCircle
 * - ✅ Filtrage inline: TextField recherche code/titre
 * - ✅ Tri colonnes cliquable: code, date, priorité (ChevronUp/Down)
 * - ✅ Pagination: si >10 interventions (prev/next buttons)
 * 
 * 📋 TODO:
 * - [ ] Actions bulk (sélection multiple, changement statut)
 * - [ ] Export CSV/Excel interventions ouvertes
 * - [ ] Indicateur technicien assigné (avatar + nom)
 * - [ ] Temps écoulé mise à jour temps réel (useInterval)
 * - [ ] Collapse détails intervention inline (expand row)
 * - [ ] Icônes actions supplémentaires (Edit, Archive)
 * 
 * @module components/machine/OpenInterventionsTable
 * @requires config/interventionTypes - Types, statuts, priorités
 */

import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import { Box, Heading, Flex, Button, Card, Table, Text, Badge, TextField } from "@radix-ui/themes";
import { ExternalLink, Eye, Clock, AlertCircle, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { INTERVENTION_TYPES, STATUS_CONFIG, PRIORITY_CONFIG } from "@/config/interventionTypes";

/**
 * Ordre de priorité pour tri (index plus petit = priorité plus haute)
 */
const PRIORITY_ORDER = {
  'urgent': 0,
  'high': 1,
  'medium': 2,
  'low': 3
};

/**
 * Calcule le nombre de jours depuis une date
 * @param {string} dateString - Date au format ISO
 * @returns {number} Nombre de jours écoulés
 */
const getDaysSince = (dateString) => {
  if (!dateString) return 0;
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = Math.abs(today - date);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Détermine la couleur du badge retard selon la durée
 * @param {number} days - Nombre de jours écoulés
 * @returns {string} Couleur badge ('red'|'amber'|null)
 */
const getDelayColor = (days) => {
  if (days > 14) return 'red';
  if (days > 7) return 'amber';
  return null;
};

/**
 * Calcule le temps total consommé sur une intervention
 * @param {Object} intervention - Objet intervention
 * @returns {number} Temps total en heures
 */
const calculateTotalTime = (intervention) => {
  if (!intervention || !intervention.action || intervention.action.length === 0) {
    return 0;
  }
  return intervention.action.reduce((total, action) => {
    return total + (parseFloat(action.time_spent) || 0);
  }, 0);
};

/**
 * Affiche tableau des interventions ouvertes pour une machine
 * 
 * @param {Object} props
 * @param {Array} props.interventions - Liste des interventions ouvertes
 * @param {string} props.machineId - ID de la machine (pour lien "Voir toutes")
 * @returns {JSX.Element|null} Table interventions ou null si vide
 * 
 * @example
 * <OpenInterventionsTable 
 *   interventions={[
 *     { id: 1, code: 'INT-001', title: 'Panne moteur', type_inter: 'COR', priority: 'urgent' }
 *   ]}
 *   machineId="123"
 * />
 */
export default function OpenInterventionsTable({ interventions, machineId }) {
  // États locaux
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ column: 'priority', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtrage par recherche
  const filteredInterventions = useMemo(() => {
    if (!interventions || interventions.length === 0) return [];
    
    if (!searchTerm) return interventions;
    
    const search = searchTerm.toLowerCase();
    return interventions.filter(int => 
      int.code?.toLowerCase().includes(search) ||
      int.title?.toLowerCase().includes(search)
    );
  }, [interventions, searchTerm]);

  // Tri des interventions
  const sortedInterventions = useMemo(() => {
    if (filteredInterventions.length === 0) return [];
    
    return [...filteredInterventions].sort((a, b) => {
      let aVal, bVal;
      
      switch (sortConfig.column) {
        case 'code':
          aVal = a.code || '';
          bVal = b.code || '';
          break;
        case 'date':
          aVal = a.reported_date ? new Date(a.reported_date).getTime() : 0;
          bVal = b.reported_date ? new Date(b.reported_date).getTime() : 0;
          break;
        case 'priority':
        default:
          aVal = PRIORITY_ORDER[a.priority?.toLowerCase()] ?? 999;
          bVal = PRIORITY_ORDER[b.priority?.toLowerCase()] ?? 999;
          break;
      }
      
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredInterventions, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(sortedInterventions.length / itemsPerPage);
  const paginatedInterventions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedInterventions.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedInterventions, currentPage]);

  // Handler tri colonne
  const handleSort = (column) => {
    setSortConfig(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Rendu icône tri
  const SortIcon = ({ column }) => {
    if (sortConfig.column !== column) return null;
    return sortConfig.direction === 'asc' ? 
      <ChevronUp size={14} /> : 
      <ChevronDown size={14} />;
  };

  // PropTypes pour SortIcon
  SortIcon.propTypes = {
    column: PropTypes.string.isRequired
  };

  // Empty state si aucune intervention
  if (!interventions || interventions.length === 0) {
    return (
      <Card>
        <Flex direction="column" align="center" justify="center" p="6" gap="3">
          <AlertCircle size={48} color="var(--gray-9)" />
          <Heading size="4" color="gray">Aucune intervention ouverte</Heading>
          <Text size="2" color="gray" style={{ fontStyle: 'italic' }}>
            Cette machine n&apos;a actuellement aucune intervention en cours
          </Text>
        </Flex>
      </Card>
    );
  }

  return (
    <Box>
      {/* En-tête avec compteur et lien */}
      <Flex justify="between" align="center" mb="2">
        <Heading size="5" color="orange">
          Interventions ouvertes ({interventions.length})
        </Heading>
        <Button size="2" variant="soft" asChild>
          <Link 
            to={`/interventions?machine=${machineId}`} 
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <ExternalLink size={14} style={{ marginRight: '6px' }} />
            Voir toutes
          </Link>
        </Button>
      </Flex>

      {/* Recherche */}
      <Card mb="2">
        <Box p="2">
          <TextField.Root
            placeholder="Rechercher par code ou titre..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); // Reset à page 1 lors de la recherche
            }}
            size="2"
          />
        </Box>
      </Card>

      {/* Table des interventions */}
      <Card>
        <Table.Root variant="surface" size="1">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell 
                style={{ cursor: 'pointer' }}
                onClick={() => handleSort('code')}
              >
                <Flex align="center" gap="1">
                  Code
                  <SortIcon column="code" />
                </Flex>
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Titre</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Type</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell 
                style={{ cursor: 'pointer' }}
                onClick={() => handleSort('priority')}
              >
                <Flex align="center" gap="1">
                  Priorité
                  <SortIcon column="priority" />
                </Flex>
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Statut</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell 
                style={{ cursor: 'pointer' }}
                onClick={() => handleSort('date')}
              >
                <Flex align="center" gap="1">
                  Date
                  <SortIcon column="date" />
                </Flex>
              </Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Ouverture</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Consommé</Table.ColumnHeaderCell>
              <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
            </Table.Row>
          </Table.Header>

          <Table.Body>
            {paginatedInterventions.map(intervention => {
              const interventionType = INTERVENTION_TYPES.find(
                t => t.id === intervention.type_inter
              );
              const daysSince = getDaysSince(intervention.reported_date);
              const delayColor = getDelayColor(daysSince);
              const isUrgent = intervention.priority?.toLowerCase() === 'urgent';
              const rowBackground = isUrgent ? 'var(--red-2)' : undefined;
              const totalTime = calculateTotalTime(intervention);

              return (
                <Table.Row key={intervention.id} style={{ background: rowBackground }}>
                  {/* Code avec lien */}
                  <Table.Cell>
                    <Link 
                      to={`/intervention/${intervention.id}`} 
                      style={{ textDecoration: 'none' }}
                    >
                      <Text weight="bold" color="blue">
                        {intervention.code || "N/A"}
                      </Text>
                    </Link>
                  </Table.Cell>

                  {/* Titre */}
                  <Table.Cell>
                    <Text size="1">{intervention.title || "Sans titre"}</Text>
                  </Table.Cell>

                  {/* Type */}
                  <Table.Cell>
                    <Badge 
                      color={interventionType?.color || 'gray'} 
                      size="1"
                    >
                      {interventionType?.title || intervention.type || "N/A"}
                    </Badge>
                  </Table.Cell>

                  {/* Priorité */}
                  <Table.Cell>
                    <Badge 
                      color={PRIORITY_CONFIG[intervention.priority?.toLowerCase()]?.color || 'gray'} 
                      size="1"
                    >
                      {intervention.priority || "N/A"}
                    </Badge>
                  </Table.Cell>

                  {/* Statut */}
                  <Table.Cell>
                    <Badge 
                      color={STATUS_CONFIG[intervention.status?.value?.toLowerCase()]?.color || 'gray'} 
                      size="1"
                    >
                      {STATUS_CONFIG[intervention.status?.value?.toLowerCase()]?.label || intervention.status_actual?.value || "N/A"}
                    </Badge>
                  </Table.Cell>

                  {/* Date */}
                  <Table.Cell>
                    <Text size="1">
                      {intervention.reported_date 
                        ? new Date(intervention.reported_date).toLocaleDateString('fr-FR')
                        : "N/A"}
                    </Text>
                  </Table.Cell>

                  {/* Durée ouverture avec badge retard */}
                  <Table.Cell>
                    <Flex align="center" gap="1">
                      <Clock size={12} color="var(--gray-9)" />
                      <Text size="1" color="gray">
                        {daysSince}j
                      </Text>
                      {delayColor && (
                        <Badge color={delayColor} size="1">
                          Retard
                        </Badge>
                      )}
                    </Flex>
                  </Table.Cell>

                  {/* Temps consommé */}
                  <Table.Cell>
                    <Text size="1" weight="bold" color="blue">
                      {totalTime > 0 ? `${totalTime.toFixed(1)}h` : '0h'}
                    </Text>
                  </Table.Cell>

                  {/* Actions */}
                  <Table.Cell>
                    <Button size="1" variant="soft" asChild>
                      <Link 
                        to={`/intervention/${intervention.id}`} 
                        style={{ textDecoration: 'none', color: 'inherit' }}
                      >
                        <Eye size={12} style={{ marginRight: '4px' }} />
                        Voir
                      </Link>
                    </Button>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Root>

        {/* Pagination */}
        {totalPages > 1 && (
          <Flex justify="between" align="center" p="3">
            <Text size="2" color="gray">
              Page {currentPage} sur {totalPages} ({sortedInterventions.length} résultat{sortedInterventions.length > 1 ? 's' : ''})
            </Text>
            <Flex gap="2">
              <Button 
                size="1" 
                variant="soft"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => p - 1)}
              >
                <ChevronLeft size={14} />
                Précédent
              </Button>
              <Button 
                size="1" 
                variant="soft"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => p + 1)}
              >
                Suivant
                <ChevronRight size={14} />
              </Button>
            </Flex>
          </Flex>
        )}
      </Card>
    </Box>
  );
}

// PropTypes pour validation runtime
OpenInterventionsTable.propTypes = {
  interventions: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      code: PropTypes.string,
      title: PropTypes.string,
      type_inter: PropTypes.string,
      priority: PropTypes.string,
      reported_date: PropTypes.string,
      status_actual: PropTypes.shape({
        id: PropTypes.string,
        value: PropTypes.string
      })
    })
  ).isRequired,
  machineId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired
};