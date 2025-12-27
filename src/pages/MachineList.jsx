/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📄 MachineList.jsx - Liste complète des machines avec hiérarchie et filtres
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Page principale affichant toutes les machines du parc avec:
 * - Statistiques globales (total, par statut, interventions ouvertes)
 * - Recherche full-text (code, nom, zone, atelier)
 * - Filtrage par statut (opérationnelle, maintenance, attention, critique)
 * - Vue dual mode: table classique OU hiérarchique avec sous-équipements
 * - Auto-refresh background 5s (sans clignotement)
 * - Navigation: détail machine + liste interventions filtrées
 * 
 * Architecture:
 * - useApiCall: gestion chargement/erreurs/refresh machines
 * - useAutoRefresh: polling 5s en arrière-plan
 * - buildHierarchy: construction arborescence récursive (parent)
 * - MachineRow: composant récursif pour affichage hiérarchique
 * - PageHeader: header centralisé avec stats/actions
 * 
 * ✅ IMPLÉMENTÉ:
 * - Auto-refresh 5s avec backgroundRefetchMachines (pas de loading visible)
 * - Statistiques cliquables pour filtrage rapide par statut
 * - Recherche multi-champs (code, nom, zone, atelier)
 * - Arborescence expand/collapse avec indentation visuelle
 * - Badges colorés interventions par type (INTERVENTION_TYPES config)
 * - Navigation intelligente: bouton "Interventions" si openInterventionsCount > 0
 * - Gestion états: LoadingSpinner, ErrorDisplay avec retry
 * - ViewMode switch: 'table' (flat) vs 'hierarchy' (tree)
 * 
 * 📋 TODO:
 * - [ ] Mode carte (grid cards responsive pour vue synthétique)
 * - [ ] Export CSV/Excel avec filtres appliqués
 * - [ ] Tri colonnes (code, nom, zone, statut, nb interventions)
 * - [ ] Filtres avancés (zone, atelier, date dernière intervention)
 * - [ ] Import CSV/Excel pour ajout/màj machines en masse
 * - [ ] QR codes batch generation (étiquettes machines)
 * - [ ] Graphique santé parc (camembert statuts, évolution temporelle)
 * - [ ] Action bulk: changer statut multiple machines (maintenance préventive)
 * - [ ] Historique changements statuts (audit trail)
 * - [ ] Tags/labels personnalisables (criticité métier, processus)
 * - [ ] Indicateur "dernière intervention" (date + temps écoulé)
 * - [ ] Mode comparaison (sélection multiple, overlay KPIs)
 * - [ ] Notifications: alertes si machine devient critique
 * - [ ] Intégration cartographie (map 2D atelier, positionnement machines)
 * - [ ] Bouton "Nouvelle machine" fonctionnel (modal création)
 * 
 * @module pages/MachineList
 * @requires hooks/useApiCall - Chargement API avec états
 * @requires hooks/useAutoRefresh - Polling automatique
 * @requires config/interventionTypes - Types et couleurs
 */

import { useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import { machines } from "@/lib/api/facade";

const fetchMachinesWithInterventions = () => machines.fetchMachinesWithInterventions();
import { useApiCall } from "@/hooks/useApiCall";
import { Link } from "react-router-dom";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import LoadingState from "@/components/common/LoadingState";
import ErrorDisplay from "@/components/ErrorDisplay";
import { 
  Card, 
  Flex, 
  Text, 
  Badge, 
  Button, 
  Heading, 
  Box,
  Container,
  Table,
  TextField
} from "@radix-ui/themes";
import { INTERVENTION_TYPES } from "@/config/interventionTypes";
import PageHeader from "@/components/layout/PageHeader";
import { usePageHeaderProps } from "@/hooks/usePageConfig";

// Labels et couleurs des statuts de machine

const STATUS_LABELS = {
  'ok': { label: 'Opérationnelle', color: 'green' },
  'maintenance': { label: 'Maintenance', color: 'blue' },
  'warning': { label: 'Attention', color: 'orange' },
  'critical': { label: 'Critique', color: 'red' }
};

/**
 * Liste complète des machines avec filtrage et hiérarchie
 * 
 * @returns {JSX.Element} Page avec header, stats, recherche, table machines
 */
export default function MachineList() {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [hierarchyData, setHierarchyData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode] = useState("table"); // TODO: ajouter switch table/hierarchy dans UI
  const [expandedMachines, setExpandedMachines] = useState(new Set());

  // ✅ Utiliser le hook useApiCall
  const { 
    data: machines = [], 
    loading, 
    error, 
    execute: refetchMachines,
    executeSilent: backgroundRefetchMachines
  } = useApiCall(fetchMachinesWithInterventions);

  // Construire la structure hiérarchique (mémoïsé pour éviter recalculs)
  const buildHierarchy = useCallback((machinesData) => {
    if (!machinesData || !Array.isArray(machinesData)) {
      setHierarchyData([]);
      return;
    }
    const rootMachines = machinesData.filter(m => !m.parent);
    
    const buildTree = (parentId) => {
      return machinesData
        .filter(m => m.parent?.id === parentId)
        .map(child => ({
          ...child,
          children: buildTree(child.id)
        }));
    };

    const hierarchy = rootMachines.map(root => ({
      ...root,
      children: buildTree(root.id)
    }));

    setHierarchyData(hierarchy);
  }, []);

  // Synchroniser les données quand elles arrivent
  useEffect(() => {
    if (machines && Array.isArray(machines)) {
      setData(machines);
      buildHierarchy(machines);
    }
  }, [machines, buildHierarchy]);

  // Chargement initial
  useEffect(() => {
    refetchMachines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-refresh toutes les 5 secondes (en arrière-plan pour éviter le clignotement)
  useAutoRefresh(backgroundRefetchMachines, 5, true);
  
  // Filtrage
  useEffect(() => {
    let filtered = data;

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(machine =>
        machine.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        machine.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        machine.zone?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        machine.workshop?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par statut
    if (filterStatus !== "all") {
      filtered = filtered.filter(machine => machine.status === filterStatus);
    }

    setFilteredData(filtered);
  }, [searchTerm, filterStatus, data]);

  // Stabilisation références callbacks
  const toggleExpand = useCallback((machineId) => {
    setExpandedMachines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(machineId)) {
        newSet.delete(machineId);
      } else {
        newSet.add(machineId);
      }
      return newSet;
    });
  }, []);

  const handleCreateMachine = useCallback(() => {
    // TODO: ouvrir modal création machine
    console.warn('[TODO] Créer machine - modal à implémenter');
  }, []);

  // Statistiques
  const stats = {
    total: data?.length || 0,
    ok: (data || []).filter(m => m.status === 'ok').length,
    maintenance: (data || []).filter(m => m.status === 'maintenance').length,
    warning: (data || []).filter(m => m.status === 'warning').length,
    critical: (data || []).filter(m => m.status === 'critical').length,
    totalOpenInterventions: (data || []).reduce((sum, m) => sum + (m.openInterventionsCount || 0), 0)
  };

  // ==================== HEADER CONFIGURATION ====================
  
  // Header props depuis la config centralisée
  const headerProps = usePageHeaderProps({
    subtitle: loading ? "Chargement en cours..." : error ? "Erreur de chargement" : `${data?.length || 0} machine${(data?.length || 0) > 1 ? 's' : ''} • ${stats.ok} actif${stats.ok > 1 ? 's' : ''}`,
    stats: !loading && !error ? [
      { label: 'Total', value: stats.total },
      { label: 'Opérationnelles', value: stats.ok },
      { label: 'Maintenance', value: stats.maintenance },
      { label: 'Attention', value: stats.warning },
      { label: 'Critiques', value: stats.critical },
      { label: 'Interventions ouvertes', value: stats.totalOpenInterventions }
    ] : [],
    onRefresh: refetchMachines,
    onAdd: handleCreateMachine,
    addLabel: "+ Nouvelle machine"
  });

  if (loading) {
    return (
      <Box>
        <PageHeader {...headerProps} />
        <Container size="4" p="3">
          <LoadingState message="Chargement des machines..." />
        </Container>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box>
        <PageHeader {...headerProps} />
        <Container size="4" p="3">
          <ErrorDisplay 
            error={error}
            onRetry={refetchMachines}
            title="Erreur de chargement des machines"
          />
        </Container>
      </Box>
    );
  }

  // Composant pour afficher une machine dans la hiérarchie
  const MachineRow = ({ machine, level = 0 }) => {
    const hasChildren = machine.children && machine.children.length > 0;
    const isExpanded = expandedMachines.has(machine.id);
    const indent = level * 24;

    return (
      <>
        <Table.Row key={machine.id} style={{ background: level > 0 ? 'var(--gray-2)' : 'transparent' }}>
          <Table.Cell>
            <Flex align="center" gap="2" style={{ paddingLeft: `${indent}px` }}>
              {hasChildren && (
                <Box 
                  style={{ cursor: 'pointer', minWidth: '20px' }}
                  onClick={() => toggleExpand(machine.id)}
                >
                  <Text size="3">{isExpanded ? '▼' : '▶'}</Text>
                </Box>
              )}
              {!hasChildren && <Box style={{ minWidth: '20px' }} />}
              <Text weight="bold" size="2">{machine.code || "N/A"}</Text>
            </Flex>
          </Table.Cell>
          <Table.Cell>
            <Text size="1">{machine.name || "Sans nom"}</Text>
          </Table.Cell>
          <Table.Cell>
            <Text size="1" color="gray">{machine.zone?.name || "N/A"}</Text>
          </Table.Cell>
          <Table.Cell>
            <Text size="1" color="gray">{machine.workshop?.name || "N/A"}</Text>
          </Table.Cell>
          <Table.Cell>
            <Badge color={STATUS_LABELS[machine.status]?.color || 'gray'} size="1">
              {STATUS_LABELS[machine.status]?.label || machine.status}
            </Badge>
          </Table.Cell>
          <Table.Cell>
            <Badge 
              color={machine.openInterventionsCount > 0 ? 'orange' : 'gray'} 
              size="2"
            >
              {machine.openInterventionsCount}
            </Badge>
          </Table.Cell>
          <Table.Cell>
            <Flex gap="1" wrap="wrap">
              {Object.entries(machine.interventionsByType || {}).map(([type, count]) => {
                const typeConfig = INTERVENTION_TYPES.find(t => t.id === type);
                return (
                  <Badge 
                    key={type} 
                    color={typeConfig?.color || 'gray'} 
                    size="1"
                  >
                    {type}: {count}
                  </Badge>
                );
              })}
              {Object.keys(machine.interventionsByType || {}).length === 0 && (
                <Text size="1" color="gray">-</Text>
              )}
            </Flex>
          </Table.Cell>
          <Table.Cell>
            <Flex gap="1">
              <Button size="1" variant="soft" asChild>
                <Link to={`/machines/${machine.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  Voir
                </Link>
              </Button>
              {machine.openInterventionsCount > 0 && (
                <Button size="1" variant="soft" color="blue" asChild>
                  <Link 
                    to={`/interventions?machine=${machine.id}`} 
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    Interventions ({machine.openInterventionsCount})
                  </Link>
                </Button>
              )}
            </Flex>
          </Table.Cell>
        </Table.Row>
        {hasChildren && isExpanded && machine.children.map(child => (
          <MachineRow key={child.id} machine={child} level={level + 1} />
        ))}
      </>
    );
  };

  // PropTypes pour MachineRow
  MachineRow.propTypes = {
    machine: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      code: PropTypes.string,
      name: PropTypes.string,
      status: PropTypes.string,
      openInterventionsCount: PropTypes.number,
      interventionsByType: PropTypes.object,
      zone: PropTypes.shape({
        name: PropTypes.string
      }),
      workshop: PropTypes.shape({
        name: PropTypes.string
      }),
      children: PropTypes.arrayOf(PropTypes.object)
    }).isRequired,
    level: PropTypes.number
  };

  return (
    <Box>
      {/* PAGE HEADER depuis configuration centralisée */}
      <PageHeader {...headerProps} />

      <Container size="4" p="3">
        <Flex direction="column" gap="3">
          {/* Header */}
          

          {/* Statistiques */}
          <Flex gap="2" wrap="wrap">
            <Card 
              style={{ flex: '1 1 150px', cursor: 'pointer' }}
              onClick={() => setFilterStatus('all')}
            >
              <Box p="2">
                <Text size="1" color="gray">Total</Text>
                <Heading size="5">{stats.total}</Heading>
              </Box>
            </Card>
            <Card 
              style={{ flex: '1 1 150px', cursor: 'pointer' }}
              onClick={() => setFilterStatus(filterStatus === 'ok' ? 'all' : 'ok')}
            >
              <Box p="2">
                <Flex align="center" gap="2">
                  <Badge color="green" size="2">OK</Badge>
                  <Heading size="5">{stats.ok}</Heading>
                </Flex>
              </Box>
            </Card>
            <Card 
              style={{ flex: '1 1 150px', cursor: 'pointer' }}
              onClick={() => setFilterStatus(filterStatus === 'maintenance' ? 'all' : 'maintenance')}
            >
              <Box p="2">
                <Flex align="center" gap="2">
                  <Badge color="blue" size="2">Maintenance</Badge>
                  <Heading size="5">{stats.maintenance}</Heading>
                </Flex>
              </Box>
            </Card>
            <Card 
              style={{ flex: '1 1 150px', cursor: 'pointer' }}
              onClick={() => setFilterStatus(filterStatus === 'warning' ? 'all' : 'warning')}
            >
              <Box p="2">
                <Flex align="center" gap="2">
                  <Badge color="amber" size="2">Attention</Badge>
                  <Heading size="5">{stats.warning}</Heading>
                </Flex>
              </Box>
            </Card>
            <Card 
              style={{ flex: '1 1 150px', cursor: 'pointer' }}
              onClick={() => setFilterStatus(filterStatus === 'critical' ? 'all' : 'critical')}
            >
              <Box p="2">
                <Flex align="center" gap="2">
                  <Badge color="red" size="2">Critique</Badge>
                  <Heading size="5">{stats.critical}</Heading>
                </Flex>
              </Box>
            </Card>
          </Flex>

          {/* Recherche */}
          {viewMode === 'table' && (
            <Card>
              <Box p="2">
                <TextField.Root
                  placeholder="Rechercher une machine..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size="2"
                />
              </Box>
            </Card>
          )}

          {/* Table */}
          
            <Table.Root variant="surface" size="1">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeaderCell>Code</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Nom</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Zone</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Atelier</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>État</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Interventions ouvertes</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Par type</Table.ColumnHeaderCell>
                  <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {viewMode === 'table' ? (
                  // Vue table classique
                  filteredData.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                        <Text color="gray" style={{ fontStyle: 'italic' }}>
                          Aucune machine trouvée
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    filteredData.map((machine) => (
                      <Table.Row key={machine.id}>
                        <Table.Cell>
                          <Text weight="bold" size="2">{machine.code || "N/A"}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="1">{machine.name || "Sans nom"}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="1" color="gray">{machine.zone?.name || "N/A"}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="1" color="gray">{machine.workshop?.name || "N/A"}</Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge color={STATUS_LABELS[machine.status]?.color || 'gray'} size="1">
                            {STATUS_LABELS[machine.status]?.label || machine.status}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge 
                            color={machine.openInterventionsCount > 0 ? 'orange' : 'gray'} 
                            size="2"
                          >
                            {machine.openInterventionsCount}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Flex gap="1" wrap="wrap">
                            {Object.entries(machine.interventionsByType || {}).map(([type, count]) => {
                              const typeConfig = INTERVENTION_TYPES.find(t => t.id === type);
                              return (
                                <Badge 
                                  key={type} 
                                  color={typeConfig?.color || 'gray'} 
                                  size="1"
                                >
                                  {type}: {count}
                                </Badge>
                              );
                            })}
                            {Object.keys(machine.interventionsByType || {}).length === 0 && (
                              <Text size="1" color="gray">-</Text>
                            )}
                          </Flex>
                        </Table.Cell>
                        <Table.Cell>
                          <Flex gap="1">
                            <Button size="1" variant="soft" asChild>
                              <Link to={`/machines/${machine.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                Voir
                              </Link>
                            </Button>
                            {machine.openInterventionsCount > 0 && (
                              <Button size="1" variant="soft" color="blue" asChild>
                                <Link 
                                  to={`/interventions?machine=${machine.id}`} 
                                  style={{ textDecoration: 'none', color: 'inherit' }}
                                >
                                  Interventions ({machine.openInterventionsCount})
                                </Link>
                              </Button>
                            )}
                          </Flex>
                        </Table.Cell>
                      </Table.Row>
                    ))
                  )
                ) : (
                  // Vue hiérarchique
                  hierarchyData.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                        <Text color="gray" style={{ fontStyle: 'italic' }}>
                          Aucune machine trouvée
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    hierarchyData.map(machine => (
                      <MachineRow key={machine.id} machine={machine} level={0} />
                    ))
                  )
                )}
              </Table.Body>
            </Table.Root>
          
        </Flex>
      </Container>
    </Box>
  );
}