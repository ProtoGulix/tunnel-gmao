/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📄 MachineDetail.jsx - Page de pilotage opérationnel d'une machine
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Page de pilotage orientée décision : "Quelles actions dois-je prendre?"
 * Affiche UNIQUEMENT les informations impactant les décisions opérationnelles.
 * 
 * Hiérarchie stricte (du plus urgent au plus stratégique) :
 * 1. INTERVENTIONS : Liste ouvertes + clôturées < 30 jours → prioriser / clôturer / transformer
 * 2. TEMPS PASSÉ : Bilan période courante vs référence → détecter dérive charge
 * 3. DEMANDES D'ACHAT : Liées à la machine → standardiser / stocker / remettre en cause
 * 4. SUGGESTIONS PRÉVENTIF : Top 5 → empêcher récurrence
 * 
 * Architecture:
 * - Hooks: useMachineData (chargement)
 * - Composants existants réutilisés (OpenInterventionsTable, PreventiveSuggestionsPanel)
 * - Pas de nouveaux composants, uniquement organisation / filtrage / masquage
 * - États: Loading/Error avec retry, CriticalAlert si urgent
 * 
 * ✅ IMPLÉMENTÉ:
 * - Chargement données machine + interventions + actions
 * - Filtrage interventions: ouvertes OU clôturées < 30 jours
 * - Affichage anomalies: durée d'ouverture, temps passé élevé
 * - Temps passé période: total + delta vs référence (simple comparaison)
 * - Demandes d'achat liées aux interventions
 * - Suggestions préventif limitées à top 5 avec règles explicites
 * - CriticalAlert si intervention urgente
 * - Suppression KPIs sans décision, graphiques non-décisionnels
 * 
 * @module pages/MachineDetail
 * @requires hooks/useMachineData - Chargement données
 * @requires utils/interventionHelpers - Filtres interventions
 * @requires components/machine/OpenInterventionsTable - Table interventions
 * @requires components/preventive/PreventiveSuggestionsPanel - Suggestions
 */

import { useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Flex, Separator } from "@radix-ui/themes";
import { AlertOctagon, AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";

// Hooks
import { useMachineData } from "@/hooks/useMachineData";
import { useApiCall } from "@/hooks/useApiCall";

import PageContainer from "@/components/layout/PageContainer";
import PageHeader from "@/components/layout/PageHeader";

// Composants communs
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import CriticalAlert from "@/components/common/CriticalAlert";

// Composants spécifiques machine
import GeneralInfo from "@/components/machine/GeneralInfo";
import OpenInterventionsTable from "@/components/machine/OpenInterventionsTable";
import ActivityPeriod from "@/components/machine/ActivityPeriod";
import PreventiveSuggestionsPanel from "@/components/preventive/PreventiveSuggestionsPanel";
import PurchaseRequestsTable from "@/components/purchase/requests/PurchaseRequestsTable";

// Utilitaires
import { stock } from "@/lib/api/facade";
import { isInterventionOpen } from "@/lib/utils/interventionHelpers";

const STATUS_LABELS = {
  ok: { label: "Opérationnelle", color: "green", Icon: CheckCircle2 },
  critical: { label: "Critique", color: "red", Icon: AlertOctagon }
};

/**
 * Filtre les interventions pour la page de pilotage
 * Inclut: ouvertes ET clôturées < 30 jours
 */
const filterDecisionalInterventions = (interventions) => {
  if (!interventions || interventions.length === 0) return [];
  
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const thirtyDaysAgo = new Date(Date.now() - thirtyDaysMs);
  
  return interventions.filter(intervention => {
    if (isInterventionOpen(intervention)) return true;
    
    if (intervention.closed_date) {
      const closedDate = new Date(intervention.closed_date);
      return closedDate >= thirtyDaysAgo;
    }
    
    if (intervention.reported_date) {
      const reportedDate = new Date(intervention.reported_date);
      return reportedDate >= thirtyDaysAgo;
    }
    
    return false;
  });
};

/**
 * Calcule le temps passé sur une période donnée
 */
const getTimeSpentInPeriod = (actions, periodMs) => {
  const periodStart = new Date(Date.now() - periodMs);
  
  return (actions || []).reduce((total, action) => {
    const createdAt = action.createdAt || action.created_at;
    const timeSpent = action.timeSpent ?? action.time_spent;
    if (!createdAt) return total;
    const actionDate = new Date(createdAt);
    if (actionDate >= periodStart) {
      return total + parseFloat(timeSpent || 0);
    }
    return total;
  }, 0);
};

/**
 * Filtre les demandes d'achat liées aux interventions de la machine
 */
const getMachineRequests = (requests, interventions) => {
  if (!requests || !Array.isArray(requests) || !interventions || !Array.isArray(interventions)) {
    return [];
  }
  const interventionIds = new Set(interventions.map(i => i.id));
  return requests.filter(req => interventionIds.has(req.intervention_id));
};

/**
 * Détermine si une alerte urgente doit être affichée
 */
const hasUrgentAlert = (interventions) => {
  return interventions.some(i => i.priority?.toLowerCase() === 'urgent');
};

/**
 * Page de détail d'une machine - Orientation décisionnelle
 * 
 * Affiche les éléments impactant les décisions opérationnelles:
 * 1. Interventions (ouvertes + clôturées < 30j)
 * 2. Temps passé (bilan période)
 * 3. Demandes d'achat (récurrence)
 * 4. Suggestions préventif (top 5)
 * 
 * @returns {JSX.Element} Page complète
 */
export default function MachineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Chargement des données machine
  const { 
    machine, 
    interventions, 
    actions, 
    loading, 
    error, 
    reload 
  } = useMachineData(id);

  // Chargement des demandes d'achat
  const { 
    data: purchaseRequests = [], 
    loading: requestsLoading 
  } = useApiCall(
    () => stock.fetchPurchaseRequests(),
    { autoExecute: true }
  );

  // Chargement des articles de stock
  const { 
    data: stockItems = [] 
  } = useApiCall(
    () => stock.fetchStockItems(),
    { autoExecute: true }
  );

  // Filtrage des interventions décisionnelles (ouvertes + clôturées < 30j)
  const decisionalInterventions = useMemo(
    () => filterDecisionalInterventions(interventions),
    [interventions]
  );

  // Filtrage des demandes d'achat liées à cette machine
  const machineRequests = useMemo(
    () => getMachineRequests(purchaseRequests, interventions),
    [purchaseRequests, interventions]
  );

  // Calcul des temps passés
  const timeSpentLast30Days = useMemo(
    () => getTimeSpentInPeriod(actions, 30 * 24 * 60 * 60 * 1000),
    [actions]
  );

  // Déterminer s'il y a une alerte urgente
  const urgentAlert = useMemo(
    () => hasUrgentAlert(decisionalInterventions),
    [decisionalInterventions]
  );

  const globalStatus = urgentAlert ? "critical" : "ok";
  const statusConfig = useMemo(
    () => STATUS_LABELS[globalStatus] || STATUS_LABELS.ok,
    [globalStatus]
  );

  const decisionalInterventionCount = decisionalInterventions?.length || 0;

  // Stabilisation référence reload
  const handleReload = useCallback(() => {
    reload();
  }, [reload]);

  const headerProps = useMemo(
    () => ({
      title: machine?.code || "Machine",
      subtitle: machine?.name || "Détails opérationnels",
      icon: statusConfig.Icon,
      stats: [
        { label: "État", value: statusConfig.label, color: statusConfig.color },
        { label: "Interventions décisionnelles", value: decisionalInterventionCount }
      ],
      actions: [
        {
          label: "Retour aux machines",
          onClick: () => navigate("/machines"),
          icon: ArrowLeft,
          variant: "soft",
          color: "gray"
        }
      ],
      onRefresh: handleReload
    }),
    [
      machine?.code,
      machine?.name,
      statusConfig,
      decisionalInterventionCount,
      navigate,
      handleReload
    ]
  );

  // ==========================================
  // GESTION DES ÉTATS
  // ==========================================
  
  if (loading) {
    return <LoadingState message="Chargement des données de la machine..." />;
  }
  
  if (error || !machine) {
    return <ErrorState error={error} onRetry={handleReload} />;
  }

  // ==========================================
  // RENDU PRINCIPAL
  // ==========================================
  
  return (
    <PageContainer>
      <PageHeader {...headerProps} />
      <Flex direction="column" gap="5">
        <CriticalAlert 
          show={urgentAlert}
          title="Intervention urgente"
          message="Une intervention marquée comme urgente requiert une action immédiate."
          severity="error"
          icon={<AlertTriangle size={20} color="var(--red-9)" />}
        />

        <GeneralInfo machine={machine} />
        <Separator size="3" />

        {/* BLOC 1: INTERVENTIONS */}
        <OpenInterventionsTable interventions={decisionalInterventions} machineId={id} />
        <Separator size="3" />

        {/* BLOC 2: TEMPS PASSÉ */}
        <ActivityPeriod
          interventionCount={decisionalInterventions.length}
          timeSpent={timeSpentLast30Days / 60}
          periodDays={30}
          historicalCount={interventions.length}
        />
        <Separator size="3" />

        {/* BLOC 3: DEMANDES D&apos;ACHAT */}
        {machineRequests.length > 0 && (
          <>
            <PurchaseRequestsTable
              requests={machineRequests}
              stockItems={stockItems}
              supplierRefs={{}}
              standardSpecs={{}}
              suppliers={[]}
              loading={requestsLoading}
              compact={true}
            />
            <Separator size="3" />
          </>
        )}

        {/* BLOC 4: PRÉVENTIF */}
        <PreventiveSuggestionsPanel machineId={id} status="NEW" />
      </Flex>
    </PageContainer>
  );
}