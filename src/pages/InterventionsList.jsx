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
  Badge,
  Flex,
  Tooltip,
} from '@radix-ui/themes';

// 4. Icons (conformément aux conventions, via '@/lib/icons')
import { FileText } from '@/lib/icons';

// 5. Components
import PageHeader from '@/components/layout/PageHeader';
import LoadingState from '@/components/common/LoadingState';
import ErrorDisplay from '@/components/ErrorDisplay';
import SearchField from '@/components/common/SearchField';
import InteractiveTable from '@/components/common/InteractiveTable';

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
      const { status, type: rawType, priority, printedFiche } = i; // DTO normalized status: 'open' | 'in_progress' | 'closed' | 'cancelled'
      const type = rawType?.toUpperCase();
      
      // BLOC 4 : Archivé (closed ou cancelled) - Masquer les fiches imprimées (déjà traitées)
      if (status === 'closed' || status === 'cancelled') {
        // Ne charger que les fiches non imprimées pour éviter le bruit
        if (!printedFiche) {
          archivé.push(i);
        }
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

  // Tri : priorité, fiches non imprimées en haut (pour clôture), puis âge décroissant
  const sortInterventions = useCallback((interventions) => {
    const priorityOrder = { urgent: 0, important: 1, normal: 2, faible: 3 };
    
    return [...interventions].sort((a, b) => {
      const priorityA = priorityOrder[a.priority?.toLowerCase()] ?? 2;
      const priorityB = priorityOrder[b.priority?.toLowerCase()] ?? 2;
      
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }
      
      // Tri secondaire : fiches non imprimées en haut (pour clôture)
      const printedA = a.printedFiche ? 1 : 0;
      const printedB = b.printedFiche ? 1 : 0;
      if (printedA !== printedB) {
        return printedA - printedB;
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

  const handleOpenIntervention = useCallback((interv) => {
    navigate(`/intervention/${interv.id}`);
  }, [navigate]);

  // Configuration des colonnes pour BLOC 1 : À faire maintenant
  const actionnableColumns = [
    { key: 'intervention', header: 'Intervention', width: undefined, align: 'left' },
    { key: 'age', header: 'Âge', width: '80px', align: 'right' },
    { key: '_action', header: '', width: '100px', align: 'center' }
  ];

  // Configuration des colonnes pour BLOC 2 : Bloqué
  const bloqueColumns = [
    { key: 'intervention', header: 'Intervention bloquée', width: undefined, align: 'left' },
    { key: '_action', header: '', width: '100px', align: 'center' }
  ];

  // Configuration des colonnes pour BLOC 3 & 4 : Projets et Archivé
  const standardColumns = [
    { key: 'title', header: 'Titre', width: undefined, align: 'left' },
    { key: 'status', header: 'Statut', width: undefined, align: 'left' },
    { key: 'age', header: 'Âge', width: undefined, align: 'left' },
    { key: '_action', header: '', width: '100px', align: 'center' }
  ];

  // Fonction de rendu des cellules pour BLOC 1 : À faire maintenant
  const renderActionnableCell = useCallback((interv, column) => {
    const priorityConfig = PRIORITY_CONFIG[interv.priority?.toLowerCase()] || PRIORITY_CONFIG.normal;
    const age = calculateAge(interv.reportedDate);
    const ageColor = getAgeColor(age);
    const showAge = shouldShowAge(age, interv.priority);
    const machineCode = interv.machine?.code || 'SUPP';
    const intervCode = interv.code || '';
    const responsableInitiales = (interv.techInitials || '—').toUpperCase();

    switch (column.key) {
      case 'intervention':
        return (
          <Flex direction="column" gap="2">
            <Flex align="center" gap="2" wrap="wrap">
              <Badge color={priorityConfig.color} size="1" variant="solid">
                {interv.priority || 'Normal'}
              </Badge>
              <Badge color="gray" variant="solid" size="1" style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                {machineCode}
              </Badge>
              <Badge color="blue" variant="solid" size="1" style={{ fontFamily: 'monospace', fontWeight: '600' }}>
                {intervCode}
              </Badge>
              {interv.printedFiche && (
                <Tooltip content="Fiche imprimée et classée">
                  <Badge color="green" variant="soft" size="1">
                    <FileText size={12} style={{ marginRight: '2px' }} />
                    ✓ Imprimée
                  </Badge>
                </Tooltip>
              )}
              <Text size="2" style={{ color: 'var(--gray-10)' }}>·</Text>
              <Text size="2" style={{ color: 'var(--gray-11)' }}>
                {responsableInitiales}
              </Text>
            </Flex>
            <Text size="3">
              {interv.title || 'Sans titre'}
            </Text>
          </Flex>
        );
      
      case 'age':
        if (!showAge) return null;
        return (
          <Badge color={ageColor} variant="soft" size="1">
            {age}j
          </Badge>
        );
      
      default:
        return null;
    }
  }, [calculateAge, getAgeColor, shouldShowAge]);

  // Fonction de rendu des cellules pour BLOC 2 : Bloqué
  const renderBloqueCell = useCallback((interv, column) => {
    const age = calculateAge(interv.reportedDate);
    const machineCode = interv.machine?.code || 'SUPP';
    const intervCode = interv.code || '';
    const responsableInitiales = (interv.techInitials || '—').toUpperCase();
    const cause = interv.status?.id === 'attente_pieces' ? 'attente achat' : 'attente fournisseur';
    const messageBloque = `En ${cause} depuis ${age}j`;

    switch (column.key) {
      case 'intervention':
        return (
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
              {interv.printedFiche && (
                <Tooltip content="Fiche imprimée et classée">
                  <Badge color="green" variant="soft" size="1">
                    <FileText size={12} style={{ marginRight: '2px' }} />
                    ✓ Imprimée
                  </Badge>
                </Tooltip>
              )}
              <Text size="1" style={{ color: 'var(--gray-10)' }}>·</Text>
              <Text size="1" style={{ color: 'var(--gray-10)' }}>
                {responsableInitiales}
              </Text>
            </Flex>
          </Flex>
        );
      
      default:
        return null;
    }
  }, [calculateAge]);

  // Fonction de rendu des cellules pour BLOC 3 & 4 : Projets et Archivé
  const renderStandardCell = useCallback((interv, column) => {
    const statusConfig = STATUS_CONFIG[mapDtoStatusToConfigKey(interv.status)] || STATUS_CONFIG.ouvert;
    const age = calculateAge(interv.reportedDate);
    const machineCode = interv.machine?.code || 'SUPP';
    const intervCode = interv.code || '';

    switch (column.key) {
      case 'title':
        return (
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
              {interv.printedFiche && (
                <Tooltip content="Fiche imprimée et classée">
                  <Badge color="green" variant="soft" size="1">
                    <FileText size={12} style={{ marginRight: '2px' }} />
                    ✓ Imprimée
                  </Badge>
                </Tooltip>
              )}
            </Flex>
          </Flex>
        );
      
      case 'status':
        return (
          <Badge color={statusConfig.color} size="1" variant="soft">
            {statusConfig.label}
          </Badge>
        );
      
      case 'age':
        return <Text size="2" color="gray">{age}j</Text>;
      
      default:
        return null;
    }
  }, [calculateAge]);

  // Fonction de style des lignes pour BLOC 1 : À faire maintenant
  const getActionnableRowStyle = useCallback((interv) => {
    const priorityConfig = PRIORITY_CONFIG[interv.priority?.toLowerCase()] || PRIORITY_CONFIG.normal;
    
    return {
      opacity: interv.printedFiche ? 0.5 : 1,
      backgroundColor: interv.printedFiche ? 'var(--gray-2)' : 'transparent',
      borderLeft: `4px solid ${interv.printedFiche ? 'var(--gray-6)' : `var(--${priorityConfig.color}-9)`}`
    };
  }, []);

  // Fonction de style des lignes pour BLOC 2 : Bloqué
  const getBloqueRowStyle = useCallback(() => ({
    opacity: 0.7,
    backgroundColor: "var(--gray-2)",
    borderLeft: "4px solid var(--amber-9)"
  }), []);

  // Fonction de style des lignes pour BLOC 3 & 4 : Projets et Archivé
  const getStandardRowStyle = useCallback((interv) => ({
    opacity: interv.printedFiche ? 0.5 : 1,
    backgroundColor: interv.printedFiche ? 'var(--gray-2)' : 'transparent',
    borderLeft: `4px solid ${interv.printedFiche ? 'var(--gray-6)' : 'var(--blue-9)'}`
  }), []);

  // Badge cause bloquante (jamais redondant avec statut)
  const getBadgeCause = useCallback((intervention) => {
    const statusId = intervention.status?.id;
    if (statusId === 'attente_pieces') return { label: 'Achat', color: 'orange' };
    if (statusId === 'attente_prod') return { label: 'Externe', color: 'amber' };
    return null;
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
          <SearchField
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par code machine, code intervention ou mot-clé"
            size="3"
          />
        </Box>

        {totalOpen === 0 ? (
          <Box style={{ textAlign: "center", padding: "3rem" }}>
            <Text size="3" color="gray">Aucune intervention ouverte</Text>
          </Box>
        ) : (
          <Flex direction="column" gap="5">
            {/* BLOC 1 : À FAIRE MAINTENANT */}
            <InteractiveTable
              title="🔴 À faire maintenant"
              badge={<Badge color="red" variant="solid">{sortedBlocks.actionnable.length}</Badge>}
              columns={actionnableColumns}
              data={sortedBlocks.actionnable}
              onRowClick={handleOpenIntervention}
              renderCell={renderActionnableCell}
              getRowStyle={getActionnableRowStyle}
              actionLabel="Ouvrir"
            />

            {/* BLOC 2 : BLOQUÉ */}
            <InteractiveTable
              title="🟠 Bloqué"
              badge={<Badge color="amber" variant="soft">{sortedBlocks.bloque.length}</Badge>}
              columns={bloqueColumns}
              data={sortedBlocks.bloque}
              onRowClick={handleOpenIntervention}
              renderCell={renderBloqueCell}
              getRowStyle={getBloqueRowStyle}
              actionLabel="Ouvrir"
            />

            {/* BLOC 3 : PROJETS / SUPPORT */}
            <InteractiveTable
              title="🔵 Projets / Support"
              badge={<Badge color="blue" variant="soft">{sortedBlocks.projet.length}</Badge>}
              columns={standardColumns}
              data={sortedBlocks.projet}
              onRowClick={handleOpenIntervention}
              renderCell={renderStandardCell}
              getRowStyle={getStandardRowStyle}
              actionLabel="Ouvrir"
            />

            {/* BLOC 4 : À ARCHIVER */}
            <InteractiveTable
              title="📂 À archiver"
              badge={<Badge color="blue" variant="soft">{sortedBlocks.archivé.length}</Badge>}
              columns={standardColumns}
              data={sortedBlocks.archivé}
              onRowClick={handleOpenIntervention}
              renderCell={renderStandardCell}
              getRowStyle={getStandardRowStyle}
              actionLabel="Ouvrir"
            />
          </Flex>
        )}
      </Container>
    </Box>
  );
}