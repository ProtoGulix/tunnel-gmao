// ===== IMPORTS =====
// 1. React core
import { useCallback } from 'react';

// 2. React Router
import { useNavigate } from 'react-router-dom';

// 3. UI Libraries (Radix)
import { Container, Box, Flex, Text, Heading, Badge, Grid } from '@radix-ui/themes';

// 4. Icons
import { AlertTriangle, Wrench, ShoppingCart, ClipboardCheck, Settings, FileText } from 'lucide-react';

// 5. Components
import PageContainer from '@/components/layout/PageContainer';
import LoadingState from '@/components/common/LoadingState';
import ErrorDisplay from '@/components/ErrorDisplay';
import ActionCard from '@/components/technician/ActionCard';

// 6. Hooks
import useTechnicianHome from '@/hooks/useTechnicianHome';

// 7. API
// (utilisé dans le hook)

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

// (déplacé dans le hook)

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

// (déplacé dans le hook)

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
  // ROUTER HOOKS
  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const navigate = useNavigate();

  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // DATA FETCHING
  // ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
  const {
    loading,
    error,
    urgentCount,
    openInterventionsCount,
    anomaliesCount,
    serviceStatus,
    refetchInterventions,
  } = useTechnicianHome();

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
    navigate('/procurement');
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
            <ActionCard
              title="Urgences"
              Icon={AlertTriangle}
              onClick={handleUrgencies}
              badgeCount={urgentCount}
              badgeColor="red"
              borderColor={urgentCount > 0 ? 'var(--red-9)' : 'var(--gray-6)'}
              backgroundColor={urgentCount > 0 ? 'var(--red-2)' : 'var(--gray-1)'}
              iconColor={urgentCount > 0 ? 'var(--red-9)' : 'var(--gray-9)'}
            />

            {/* CARTE : INTERVENIR */}
            <ActionCard
              title="Intervenir"
              Icon={Wrench}
              onClick={handleIntervene}
              badgeCount={openInterventionsCount}
              badgeLabel="ouvertes"
              badgeColor="blue"
              borderColor={'var(--blue-6)'}
              backgroundColor={'var(--blue-1)'}
              iconColor={'var(--blue-9)'}
            />

            {/* CARTE : ACHATS */}
            <ActionCard
              title="Achats"
              Icon={ShoppingCart}
              onClick={handlePurchases}
              borderColor={'var(--blue-6)'}
              backgroundColor={'var(--blue-1)'}
              iconColor={'var(--blue-9)'}
            />

            {/* CARTE : SUIVI */}
            <ActionCard
              title="Suivi"
              Icon={ClipboardCheck}
              onClick={handleMonitoring}
              badgeCount={anomaliesCount}
              badgeLabel="anomalies"
              badgeColor="amber"
              borderColor={anomaliesCount > 0 ? 'var(--amber-6)' : 'var(--gray-6)'}
              backgroundColor={anomaliesCount > 0 ? 'var(--amber-1)' : 'var(--gray-1)'}
              iconColor={anomaliesCount > 0 ? 'var(--amber-9)' : 'var(--gray-9)'}
            />

            {/* CARTE : MACHINES */}
            <ActionCard
              title="Machines"
              Icon={Settings}
              onClick={handleMachines}
              borderColor={'var(--gray-6)'}
              backgroundColor={'var(--gray-1)'}
              iconColor={'var(--gray-9)'}
            />

            {/* CARTE : ACTIONS */}
            <ActionCard
              title="Actions"
              Icon={FileText}
              onClick={handleActions}
              borderColor={'var(--gray-6)'}
              backgroundColor={'var(--gray-1)'}
              iconColor={'var(--gray-9)'}
            />
          </Grid>
        </Flex>
      </Container>
    </PageContainer>
  );
}
