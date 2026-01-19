// ===== IMPORTS =====
// 1. React core
import { useEffect, useMemo, useCallback, useRef } from 'react';

// 2. React Router
import { useNavigate } from 'react-router-dom';

// 3. UI Libraries (Radix)
import { Container, Box, Flex, Text, Heading, Badge, Card, Grid } from '@radix-ui/themes';

// 4. Icons
import { AlertTriangle, Wrench, ShoppingCart, ClipboardCheck, Settings, FileText } from 'lucide-react';

// 5. Components
import PageContainer from '@/components/layout/PageContainer';
import LoadingState from '@/components/common/LoadingState';
import ErrorDisplay from '@/components/ErrorDisplay';

// 6. Hooks
import { useApiCall } from '@/hooks/useApiCall';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

// 7. API
import { interventions } from '@/lib/api/facade';

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

/** Seuil d'alerte pour interventions en cours (heures) */
const IN_PROGRESS_THRESHOLD_HOURS = 24;

/** Intervalle de rafraîchissement automatique (secondes) */
const AUTO_REFRESH_INTERVAL = 30;

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Calcule l'âge d'une intervention en heures
 * @param {string} dateString - Date ISO
 * @returns {number} Âge en heures
 */
const calculateAge = (dateString) => {
  if (!dateString) return 0;
  const created = new Date(dateString);
  const now = new Date();
  return Math.floor((now - created) / (1000 * 60 * 60));
};

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Pupitre maintenance atelier - Page d'orientation rapide
 * 
 * @component
 * @description
 * Interface conçue pour PC commun en atelier, permettant accès rapide aux fonctions essentielles.
 * Grille de 6 cartes d'action avec indicateurs visuels (compteurs, couleurs).
 * 
 * @architecture
 * - État : useMemo pour calculs, useRef pour anti-patterns React StrictMode
 * - Data fetching : useApiCall avec auto-refresh 30s (silencieux)
 * - Navigation : Toutes les cartes redirigent vers pages existantes
 * 
 * @features
 * - Badge état service (NORMAL/URGENT) selon urgences
 * - Compteurs dynamiques (urgences, interventions ouvertes, anomalies)
 * - Auto-refresh sans loader visible
 * - Responsive 1/2/3 colonnes
 * 
 * @returns {JSX.Element} Page pupitre atelier
 * 
 * @example
 * <Route path="/technician" element={<TechnicianHome />} />
 */
export default function TechnicianHome() {
  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // STATE & REFS
  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const initialLoadRef = useRef(false);

  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // ROUTER HOOKS
  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const navigate = useNavigate();

  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // DATA FETCHING
  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // DATA FETCHING
  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const {
    data: allInterventions = [],
    loading,
    error,
    execute: refetchInterventions,
    executeSilent: backgroundRefetch,
  } = useApiCall(interventions.fetchInterventions, { autoExecute: false });

  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // EFFECTS
  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  
  // Initial load (protection React StrictMode)
  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    refetchInterventions();
  }, [refetchInterventions]);

  // Auto-refresh silencieux
  useAutoRefresh(backgroundRefetch, AUTO_REFRESH_INTERVAL, true);

  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // COMPUTED VALUES
  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const urgentCount = useMemo(() => {
    if (!allInterventions) return 0;
    return allInterventions.filter(
      (interv) => interv.priority === 'urgent' && interv.status === 'open'
    ).length;
  }, [allInterventions]);

  const openInterventionsCount = useMemo(() => {
    if (!allInterventions) return 0;
    return allInterventions.filter(
      (interv) => ['open', 'waiting_part', 'waiting_prod'].includes(interv.status)
    ).length;
  }, [allInterventions]);

  const hygieneIssues = useMemo(() => {
    const issues = {
      inProgressTooLong: [],
      closedWithoutActions: [],
      actionsWithoutTime: [],
    };

    if (!allInterventions) return issues;

    allInterventions.forEach((interv) => {
      if (interv.status === 'in_progress') {
        const age = calculateAge(interv.reportedDate || interv.dateCreation);
        if (age > IN_PROGRESS_THRESHOLD_HOURS) {
          issues.inProgressTooLong.push(interv);
        }
      }

      if (interv.status === 'closed') {
        const hasActions = interv.action && interv.action.length > 0;
        if (!hasActions) {
          issues.closedWithoutActions.push(interv);
        }
      }

      if (interv.action && Array.isArray(interv.action)) {
        interv.action.forEach((action) => {
          if (!action.timeSpent || action.timeSpent === 0) {
            issues.actionsWithoutTime.push({
              intervention: interv,
              action,
            });
          }
        });
      }
    });

    return issues;
  }, [allInterventions]);

  const anomaliesCount = useMemo(() => {
    return (
      hygieneIssues.inProgressTooLong.length +
      hygieneIssues.closedWithoutActions.length +
      hygieneIssues.actionsWithoutTime.length
    );
  }, [hygieneIssues]);

  const serviceStatus = useMemo(() => {
    return urgentCount > 0 ? 'URGENT' : 'NORMAL';
  }, [urgentCount]);

  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // HANDLERS & CALLBACKS
  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const handleUrgencies = useCallback(() => {
    navigate('/interventions?filter=urgent');
  }, [navigate]);

  const handleIntervene = useCallback(() => {
    navigate('/interventions');
  }, [navigate]);

  const handlePurchases = useCallback(() => {
    navigate('/purchase-requests');
  }, [navigate]);

  const handleMonitoring = useCallback(() => {
    navigate('/interventions');
  }, [navigate]);

  const handleMachines = useCallback(() => {
    navigate('/machines');
  }, [navigate]);

  const handleActions = useCallback(() => {
    navigate('/actions');
  }, [navigate]);

  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // RENDER STATES
  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  if (loading) return <LoadingState message="Chargement des données..." />;
  if (error) return <ErrorDisplay error={error} onRetry={refetchInterventions} />;

  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────

  return (
    <PageContainer>
      <Container size="4">
        <Flex direction="column" gap="4" py="5">
          {/* EN-TÊTE */}
          <Box>
            <Flex align="center" gap="2" mb="1">
              <Heading size="6" weight="bold">
                Pupitre Maintenance — Atelier
              </Heading>
              <Badge size="2" color={serviceStatus === 'URGENT' ? 'red' : 'green'} variant="solid">
                {serviceStatus}
              </Badge>
            </Flex>
            <Text size="2" color="gray">
              Accès rapide aux fonctions essentielles
            </Text>
          </Box>

          {/* GRILLE DE CARTES */}
          <Grid columns={{ initial: '1', sm: '2', md: '3' }} gap="3">
            {/* CARTE : URGENCES */}
            <Card
              style={{
                padding: '1.5rem',
                cursor: 'pointer',
                border: urgentCount > 0 ? '2px solid var(--red-9)' : '1px solid var(--gray-6)',
                backgroundColor: urgentCount > 0 ? 'var(--red-2)' : 'var(--gray-1)',
                minHeight: '140px',
              }}
              onClick={handleUrgencies}
            >
              <Flex direction="column" align="center" justify="center" gap="2" style={{ height: '100%' }}>
                <AlertTriangle size={40} color={urgentCount > 0 ? 'var(--red-9)' : 'var(--gray-9)'} />
                <Text size="4" weight="bold" align="center">
                  Urgences
                </Text>
                {urgentCount > 0 && (
                  <Badge size="2" color="red" variant="solid" radius="full">
                    {urgentCount}
                  </Badge>
                )}
              </Flex>
            </Card>

            {/* CARTE : INTERVENIR */}
            <Card
              style={{
                padding: '1.5rem',
                cursor: 'pointer',
                border: '1px solid var(--blue-6)',
                backgroundColor: 'var(--blue-1)',
                minHeight: '140px',
              }}
              onClick={handleIntervene}
            >
              <Flex direction="column" align="center" justify="center" gap="2" style={{ height: '100%' }}>
                <Wrench size={40} color="var(--blue-9)" />
                <Text size="4" weight="bold" align="center">
                  Intervenir
                </Text>
                {openInterventionsCount > 0 && (
                  <Badge size="1" color="blue" variant="soft">
                    {openInterventionsCount} ouvertes
                  </Badge>
                )}
              </Flex>
            </Card>

            {/* CARTE : ACHATS */}
            <Card
              style={{
                padding: '1.5rem',
                cursor: 'pointer',
                border: '1px solid var(--blue-6)',
                backgroundColor: 'var(--blue-1)',
                minHeight: '140px',
              }}
              onClick={handlePurchases}
            >
              <Flex direction="column" align="center" justify="center" gap="2" style={{ height: '100%' }}>
                <ShoppingCart size={40} color="var(--blue-9)" />
                <Text size="4" weight="bold" align="center">
                  Achats
                </Text>
              </Flex>
            </Card>

            {/* CARTE : SUIVI */}
            <Card
              style={{
                padding: '1.5rem',
                cursor: 'pointer',
                border: anomaliesCount > 0 ? '1px solid var(--amber-6)' : '1px solid var(--gray-6)',
                backgroundColor: anomaliesCount > 0 ? 'var(--amber-1)' : 'var(--gray-1)',
                minHeight: '140px',
              }}
              onClick={handleMonitoring}
            >
              <Flex direction="column" align="center" justify="center" gap="2" style={{ height: '100%' }}>
                <ClipboardCheck size={40} color={anomaliesCount > 0 ? 'var(--amber-9)' : 'var(--gray-9)'} />
                <Text size="4" weight="bold" align="center">
                  Suivi
                </Text>
                {anomaliesCount > 0 && (
                  <Badge size="1" color="amber" variant="soft">
                    {anomaliesCount} anomalies
                  </Badge>
                )}
              </Flex>
            </Card>

            {/* CARTE : MACHINES */}
            <Card
              style={{
                padding: '1.5rem',
                cursor: 'pointer',
                border: '1px solid var(--gray-6)',
                backgroundColor: 'var(--gray-1)',
                minHeight: '140px',
              }}
              onClick={handleMachines}
            >
              <Flex direction="column" align="center" justify="center" gap="2" style={{ height: '100%' }}>
                <Settings size={40} color="var(--gray-9)" />
                <Text size="4" weight="bold" align="center">
                  Machines
                </Text>
              </Flex>
            </Card>

            {/* CARTE : ACTIONS */}
            <Card
              style={{
                padding: '1.5rem',
                cursor: 'pointer',
                border: '1px solid var(--gray-6)',
                backgroundColor: 'var(--gray-1)',
                minHeight: '140px',
              }}
              onClick={handleActions}
            >
              <Flex direction="column" align="center" justify="center" gap="2" style={{ height: '100%' }}>
                <FileText size={40} color="var(--gray-9)" />
                <Text size="4" weight="bold" align="center">
                  Actions
                </Text>
              </Flex>
            </Card>
          </Grid>
        </Flex>
      </Container>
    </PageContainer>
  );
}
