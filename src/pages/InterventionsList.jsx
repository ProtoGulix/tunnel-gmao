// ===== IMPORTS =====
// 1. React core
import { useMemo, useCallback, useEffect, useState } from 'react';

// 2. React Router
import { useNavigate } from 'react-router-dom';

// 3. UI Libraries (Radix)
import {
  Container,
  Box,
  Text,
  Button,
  Badge,
  Table,
  Flex,
  TextField,
  Tooltip,
} from '@radix-ui/themes';

// 4. Icons
import { Search, ArrowRight } from 'lucide-react';

// 5. Components
import PageHeader from '@/components/layout/PageHeader';
import LoadingState from '@/components/common/LoadingState';
import ErrorDisplay from '@/components/ErrorDisplay';

// 6. Hooks
import { useApiCall } from '@/hooks/useApiCall';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { usePageHeaderProps } from '@/hooks/usePageConfig';

// 7. API
import { interventions } from '@/lib/api/facade';

// 8. Config
import { STATUS_CONFIG, PRIORITY_CONFIG } from '@/config/interventionTypes';

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// STATUS MAPPING (DTO → Config)
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Maps domain DTO status to config key for display.
 * @param {string} dtoStatus - Domain status ('open' | 'in_progress' | 'closed' | 'cancelled')
 * @returns {string} Config key ('ouvert' | 'attente_pieces' | 'ferme' | 'cancelled')
 */
const mapDtoStatusToConfigKey = (dtoStatus) => {
  const mapping = {
    'open': 'ouvert',
    'in_progress': 'attente_pieces', // Default to pieces for display
    'closed': 'ferme',
    'cancelled': 'cancelled'
  };
  return mapping[dtoStatus] || 'ouvert';
};

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Interventions list page with priority-based segmentation.
 * Groups open interventions into 4 blocks: actionable, blocked, projects, archived.
 * Features full-text search, smart sorting by priority & age, auto-refresh.
 *
 * @component
 * @description
 * Display all interventions in 4 visual blocks:
 * - 🔴 Actionable: Open interventions needing immediate action
 * - 🟠 Blocked: Waiting for parts/supplier (attente_pieces, attente_prod)
 * - 🔵 Projects: PRO/PIL/MES type with non-urgent priority
 * - 📦 Archived: Closed or cancelled interventions
 *
 * Search filters interventions by machine code, intervention code, or title.
 * Sorting: by priority (urgent → normal → faible) then by age (newest first).
 * Age badge shown only if > threshold (urgent & 7+ days OR 30+ days).
 *
 * @architecture
 * - State: useState for search, UI state
 * - Data fetching: useApiCall with silent background refresh
 * - Computed: useMemo for segmentation, sorting, calculations
 * - Side effects: useEffect for initial load, useAutoRefresh for polling
 *
 * @performance
 * - Memoized segmentation/sorting (recalc only on data/search change)
 * - Lazy priority/status lookups (callbacks with useCallback)
 * - Background auto-refresh (no loading state)
 *
 * @route /interventions
 * @requires Auth
 *
 * @example
 * // Route in menuConfig.js
 * { path: "/interventions", component: InterventionsList, requiresAuth: true }
 *
 * @see {@link InterventionDetail} - Detail page
 * @see {@link PRIORITY_CONFIG} - Priority colors and labels
 * @see {@link STATUS_CONFIG} - Status colors and labels
 *
 * @returns {JSX.Element} List page with 4 segmented blocks
 */
export default function InterventionsList() {
  const navigate = useNavigate();

  // État pour la recherche
  const [searchTerm, setSearchTerm] = useState("");

  // Récupération des interventions
  const { 
    data: allInterventions = [], 
    loading, 
    error, 
    execute: refetchInterventions,
    executeSilent: backgroundRefetchInterventions
  } = useApiCall(interventions.fetchInterventions);

  // Chargement initial des données
  useEffect(() => {
    refetchInterventions();
  }, [refetchInterventions]);

  // Mutation de statut inutilisée supprimée (voir page détail pour changement de statut)

  // Rafraîchissement automatique toutes les 30 secondes
  useAutoRefresh(backgroundRefetchInterventions, 30, true);

  // Filtrer par recherche puis segmenter les interventions en 3 blocs visuels
  const interventionBlocks = useMemo(() => {
    if (!allInterventions || !Array.isArray(allInterventions)) {
      return { actionnable: [], bloque: [], projet: [], archivé: [] };
    }

    // Filtrage par recherche
    const searchLower = searchTerm.toLowerCase().trim();
    const filteredInterventions = searchLower
      ? allInterventions.filter(i => {
          const machineCode = i.machine?.code?.toLowerCase() || '';
          const intervCode = i.code?.toLowerCase() || '';
          const title = i.title?.toLowerCase() || '';
          return machineCode.includes(searchLower) || 
                 intervCode.includes(searchLower) || 
                 title.includes(searchLower);
        })
      : allInterventions;

    const actionnable = [];
    const bloque = [];
    const projet = [];
    const archivé = [];

    filteredInterventions.forEach(i => {
      const { status, type: rawType, priority } = i; // DTO normalized status: 'open' | 'in_progress' | 'closed' | 'cancelled'
      const type = rawType?.toUpperCase();
      
      // BLOC 4 : Archivé (closed ou cancelled)
      if (status === 'closed' || status === 'cancelled') {
        archivé.push(i);
        return;
      }

      // BLOC 3 : Projets / Support (PRO/PIL/MES types, not urgent)
      if ((type === 'PRO' || type === 'PIL' || type === 'MES') && priority?.toLowerCase() !== 'urgent') {
        projet.push(i);
        return;
      }

      // BLOC 2 : Bloqué (in_progress means waiting for parts/supplier)
      if (status === 'in_progress') {
        bloque.push(i);
        return;
      }

      // BLOC 1 : À faire maintenant (open interventions)
      actionnable.push(i);
    });

    return { actionnable, bloque, projet, archivé };
  }, [allInterventions, searchTerm]);

  // Calcul de l'âge en jours
  const calculateAge = useCallback((reportedDate) => {
    if (!reportedDate) return 0;
    const now = new Date();
    const reported = new Date(reportedDate);
    const diffTime = Math.abs(now - reported);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }, []);

  // Tri : priorité puis âge décroissant (pour chaque bloc)
  const sortInterventions = useCallback((interventions) => {
    const priorityOrder = { urgent: 0, important: 1, normal: 2, faible: 3 };
    
    return [...interventions].sort((a, b) => {
      const priorityA = priorityOrder[a.priority?.toLowerCase()] ?? 2;
      const priorityB = priorityOrder[b.priority?.toLowerCase()] ?? 2;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      return calculateAge(b.reportedDate) - calculateAge(a.reportedDate);
    });
  }, [calculateAge]);

  const sortedBlocks = useMemo(() => ({
    actionnable: sortInterventions(interventionBlocks.actionnable),
    bloque: sortInterventions(interventionBlocks.bloque),
    projet: sortInterventions(interventionBlocks.projet),
    archivé: sortInterventions(interventionBlocks.archivé)
  }), [interventionBlocks, sortInterventions]);

  const totalOpen = interventionBlocks.actionnable.length + 
                    interventionBlocks.bloque.length + 
                    interventionBlocks.projet.length;

  // Handlers
  const handleNewIntervention = useCallback(() => {
    navigate("/intervention/new");
  }, [navigate]);

  const handleOpenIntervention = useCallback((id) => {
    navigate(`/intervention/${id}`);
  }, [navigate]);

  // Badge cause bloquante (jamais redondant avec statut)
  const getBadgeCause = useCallback((intervention) => {
    const statusId = intervention.status?.id;
    if (statusId === 'attente_pieces') return { label: 'Achat', color: 'orange' };
    if (statusId === 'attente_prod') return { label: 'Externe', color: 'amber' };
    return null;
  }, []);

  // Code couleur âge (visible seulement si > seuil)
  const getAgeColor = useCallback((days) => {
    if (days < 7) return 'gray';
    if (days < 30) return 'orange';
    return 'red';
  }, []);

  const shouldShowAge = useCallback((days, priority) => {
    if (priority?.toLowerCase() === 'urgent' && days > 7) return true;
    if (days > 30) return true;
    return false;
  }, []);

  // Configuration du header
  const headerProps = usePageHeaderProps({
    subtitle: loading 
      ? "Chargement..." 
      : `${totalOpen} intervention${totalOpen > 1 ? 's' : ''} ouverte${totalOpen > 1 ? 's' : ''}`,
    onAdd: handleNewIntervention,
    addLabel: "+ Nouvelle intervention",
    onRefresh: refetchInterventions
  });

  // États de chargement et d'erreur
  if (loading) {
    return (
      <Box>
        <PageHeader {...headerProps} />
        <Container size="4" p="3">
          <LoadingState message="Chargement des interventions..." />
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
            onRetry={refetchInterventions}
            title="Erreur de chargement des interventions"
          />
        </Container>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader {...headerProps} />
      <Container size="4" p="3">
        {/* Champ de recherche global */}
        <Box mb="4">
          <TextField.Root
            size="3"
            placeholder="Rechercher par code machine, code intervention ou mot-clé"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          >
            <TextField.Slot>
              <Search size={18} />
            </TextField.Slot>
            {searchTerm && (
              <TextField.Slot>
                <Button
                  size="1"
                  variant="ghost"
                  color="gray"
                  onClick={() => setSearchTerm("")}
                  style={{ cursor: "pointer" }}
                >
                  ✕
                </Button>
              </TextField.Slot>
            )}
          </TextField.Root>
        </Box>

        {totalOpen === 0 ? (
          <Box style={{ textAlign: "center", padding: "3rem" }}>
            <Text size="3" color="gray">Aucune intervention ouverte</Text>
          </Box>
        ) : (
          <Flex direction="column" gap="5">
            {/* BLOC 1 : À FAIRE MAINTENANT */}
            {sortedBlocks.actionnable.length > 0 && (
              <Box>
                <Flex align="center" gap="2" mb="3">
                  <Text size="5" weight="bold">🔴 À faire maintenant</Text>
                  <Badge color="red" variant="solid">{sortedBlocks.actionnable.length}</Badge>
                </Flex>
                <Table.Root variant="surface">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>Intervention</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell width="80px" style={{ textAlign: "right" }}>Âge</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell width="100px"></Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {sortedBlocks.actionnable.map((interv) => {
                      const priorityConfig = PRIORITY_CONFIG[interv.priority?.toLowerCase()] || PRIORITY_CONFIG.normal;
                      const age = calculateAge(interv.reportedDate);
                      const ageColor = getAgeColor(age);
                      const showAge = shouldShowAge(age, interv.priority);
                      const isNormalPriority = interv.priority?.toLowerCase() === 'normal' || !interv.priority;
                      
                      // Infos secondaires : CODE_MACHINE · CODE_INTERVENTION
                      const machineCode = interv.machine?.code || 'SUPP';
                      const intervCode = interv.code || '';
                      const responsableInitiales = interv.assigned_to?.first_name?.substring(0, 2).toUpperCase() || '—';
                      const responsableComplet = interv.assigned_to 
                        ? `${interv.assigned_to.first_name || ''} ${interv.assigned_to.last_name || ''}`.trim() 
                        : 'Non assigné';

                      return (
                        <Table.Row 
                          key={interv.id}
                          style={{ 
                            opacity: isNormalPriority ? 0.75 : 1,
                            borderLeft: `4px solid var(--${priorityConfig.color}-9)`
                          }}
                        >
                          <Table.Cell style={{ paddingTop: '8px', paddingBottom: '8px' }}>
                            <Flex direction="column" gap="0">
                              <Flex align="center" gap="2" style={{ marginBottom: '2px' }}>
                                <Badge color={priorityConfig.color} size="1" variant="solid">
                                  {interv.priority || 'Normal'}
                                </Badge>
                                <Text weight="bold" size="3">
                                  {interv.title || 'Sans titre'}
                                </Text>
                              </Flex>
                              <Flex align="center" gap="2" style={{ marginLeft: '2px' }}>
                                <Badge color="gray" variant="solid" size="1" style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                                  {machineCode}
                                </Badge>
                                <Badge color="blue" variant="solid" size="1" style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                                  {intervCode}
                                </Badge>
                                <Text size="2" style={{ color: 'var(--gray-10)' }}>·</Text>
                                <Tooltip content={`${responsableInitiales} – ${responsableComplet}`}>
                                  <Text size="2" style={{ color: 'var(--gray-11)', cursor: 'help' }}>
                                    {responsableInitiales}
                                  </Text>
                                </Tooltip>
                              </Flex>
                            </Flex>
                          </Table.Cell>
                          <Table.Cell style={{ textAlign: "right", verticalAlign: "middle", paddingTop: '8px', paddingBottom: '8px' }}>
                            {showAge && (
                              <Badge color={ageColor} variant="soft" size="1">
                                {age}j
                              </Badge>
                            )}
                          </Table.Cell>
                          <Table.Cell style={{ textAlign: "center", verticalAlign: "middle", paddingTop: '8px', paddingBottom: '8px' }}>
                            <Button
                              size="2"
                              variant="soft"
                              onClick={() => handleOpenIntervention(interv.id)}
                            >
                              <ArrowRight size={14} />
                              Ouvrir
                            </Button>
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}

            {/* BLOC 2 : BLOQUÉ */}
            {sortedBlocks.bloque.length > 0 && (
              <Box>
                <Flex align="center" gap="2" mb="3">
                  <Text size="5" weight="bold">🟠 Bloqué</Text>
                  <Badge color="amber" variant="soft">{sortedBlocks.bloque.length}</Badge>
                </Flex>
                <Table.Root variant="surface">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>Intervention bloquée</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell width="100px"></Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {sortedBlocks.bloque.map((interv) => {
                      const age = calculateAge(interv.reportedDate);
                      const badgeCause = getBadgeCause(interv);
                      
                      // Message clair : "Bloqué – attente achat depuis Xj"
                      const machineCode = interv.machine?.code || 'SUPP';
                      const intervCode = interv.code || '';
                      const responsableInitiales = interv.assigned_to?.first_name?.substring(0, 2).toUpperCase() || '—';
                      const responsableComplet = interv.assigned_to 
                        ? `${interv.assigned_to.first_name || ''} ${interv.assigned_to.last_name || ''}`.trim() 
                        : 'Non assigné';
                      const cause = badgeCause?.label === 'Achat' ? 'attente achat' : 'attente fournisseur';
                      const messageBloque = `En ${cause} depuis ${age}j`;

                      return (
                        <Table.Row 
                          key={interv.id}
                          style={{ 
                            opacity: 0.7,
                            backgroundColor: "var(--gray-2)",
                            borderLeft: "4px solid var(--amber-9)"
                          }}
                        >
                          <Table.Cell style={{ paddingTop: '8px', paddingBottom: '8px' }}>
                            <Flex direction="column" gap="0">
                              <Text size="2" weight="medium" style={{ marginBottom: '2px' }}>
                                {interv.title || 'Sans titre'}
                              </Text>
                              <Text size="2" style={{ color: 'var(--amber-10)', fontWeight: '500', marginBottom: '4px' }}>
                                {messageBloque}
                              </Text>
                              <Flex align="center" gap="2" style={{ opacity: 0.75 }}>
                                <Badge color="gray" variant="solid" size="1" style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                                  {machineCode}
                                </Badge>
                                <Badge color="blue" variant="solid" size="1" style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                                  {intervCode}
                                </Badge>
                                <Text size="1" style={{ color: 'var(--gray-10)' }}>·</Text>
                                <Tooltip content={`${responsableInitiales} – ${responsableComplet}`}>
                                  <Text size="1" style={{ color: 'var(--gray-10)', cursor: 'help' }}>
                                    {responsableInitiales}
                                  </Text>
                                </Tooltip>
                              </Flex>
                            </Flex>
                          </Table.Cell>
                          <Table.Cell style={{ textAlign: "center", verticalAlign: "middle", paddingTop: '8px', paddingBottom: '8px' }}>
                            <Button
                              size="2"
                              variant="soft"
                              onClick={() => handleOpenIntervention(interv.id)}
                            >
                              <ArrowRight size={14} />
                              Ouvrir
                            </Button>
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}

            {/* BLOC 3 : PROJETS / SUPPORT */}
            {sortedBlocks.projet.length > 0 && (
              <Box>
                <Flex align="center" gap="2" mb="3">
                  <Text size="5" weight="bold">🔵 Projets / Support</Text>
                  <Badge color="blue" variant="soft">{sortedBlocks.projet.length}</Badge>
                </Flex>
                <Table.Root variant="surface">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>Titre</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Statut</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Âge</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell width="100px"></Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {sortedBlocks.projet.map((interv) => {
                      const statusConfig = STATUS_CONFIG[mapDtoStatusToConfigKey(interv.status)] || STATUS_CONFIG.ouvert;
                      const age = calculateAge(interv.reportedDate);
                      const machineCode = interv.machine?.code || 'SUPP';
                      const intervCode = interv.code || '';

                      return (
                        <Table.Row 
                          key={interv.id}
                          style={{ 
                            opacity: 0.85
                          }}
                        >
                          <Table.Cell>
                            <Flex direction="column" gap="1">
                              <Text size="2" weight="medium">
                                {interv.title || 'Sans titre'}
                              </Text>
                              <Flex align="center" gap="2" style={{ opacity: 0.65 }}>
                                <Badge color="gray" variant="solid" size="1" style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                                  {machineCode}
                                </Badge>
                                <Badge color="blue" variant="solid" size="1" style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                                  {intervCode}
                                </Badge>
                              </Flex>
                            </Flex>
                          </Table.Cell>
                          <Table.Cell>
                            <Badge color={statusConfig.color} size="1" variant="soft">
                              {statusConfig.label}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell>
                            <Text size="2" color="gray">{age}j</Text>
                          </Table.Cell>
                          <Table.Cell style={{ textAlign: "center" }}>
                            <Button
                              size="2"
                              variant="soft"
                              onClick={() => handleOpenIntervention(interv.id)}
                            >
                              <ArrowRight size={14} />
                              Ouvrir
                            </Button>
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}

            {/* BLOC 4 : ARCHIVÉ */}
            {sortedBlocks.archivé.length > 0 && (
              <Box>
                <Flex align="center" gap="2" mb="3">
                  <Text size="5" weight="bold">📦 Archivé</Text>
                  <Badge color="gray" variant="soft">{sortedBlocks.archivé.length}</Badge>
                </Flex>
                <Table.Root variant="surface">
                  <Table.Header>
                    <Table.Row>
                      <Table.ColumnHeaderCell>Titre</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Statut</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell>Âge</Table.ColumnHeaderCell>
                      <Table.ColumnHeaderCell width="100px"></Table.ColumnHeaderCell>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {sortedBlocks.archivé.map((interv) => {
                      const statusConfig = STATUS_CONFIG[mapDtoStatusToConfigKey(interv.status)] || STATUS_CONFIG.ferme;
                      const age = calculateAge(interv.reportedDate);
                      const machineCode = interv.machine?.code || 'SUPP';
                      const intervCode = interv.code || '';

                      return (
                        <Table.Row 
                          key={interv.id}
                          style={{ 
                            opacity: 0.6,
                            backgroundColor: "var(--gray-2)"
                          }}
                        >
                          <Table.Cell>
                            <Flex direction="column" gap="1">
                              <Text size="2" weight="medium">
                                {interv.title || 'Sans titre'}
                              </Text>
                              <Flex align="center" gap="2" style={{ opacity: 0.65 }}>
                                <Badge color="gray" variant="solid" size="1" style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                                  {machineCode}
                                </Badge>
                                <Badge color="blue" variant="solid" size="1" style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                                  {intervCode}
                                </Badge>
                              </Flex>
                            </Flex>
                          </Table.Cell>
                          <Table.Cell>
                            <Badge color={statusConfig.color} size="1" variant="soft">
                              {statusConfig.label}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell>
                            <Text size="2" color="gray">{age}j</Text>
                          </Table.Cell>
                          <Table.Cell style={{ textAlign: "center" }}>
                            <Button
                              size="2"
                              variant="soft"
                              onClick={() => handleOpenIntervention(interv.id)}
                            >
                              <ArrowRight size={14} />
                              Ouvrir
                            </Button>
                          </Table.Cell>
                        </Table.Row>
                      );
                    })}
                  </Table.Body>
                </Table.Root>
              </Box>
            )}
          </Flex>
        )}
      </Container>
    </Box>
  );
}
