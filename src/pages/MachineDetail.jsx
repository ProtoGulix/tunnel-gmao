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
 * - Hooks: useMachineData (chargement), useMachineStats (calculs statiques)
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
 * @requires hooks/useMachineStats - Calculs statistiques
 * @requires utils/interventionHelpers - Filtres interventions
 * @requires components/machine/OpenInterventionsTable - Table interventions
 * @requires components/preventive/PreventiveSuggestionsPanel - Suggestions
 */

import { useParams } from "react-router-dom";
import { useMemo, useCallback } from "react";
import { Flex, Separator } from "@radix-ui/themes";
import { AlertTriangle } from "lucide-react";

// Hooks
import { useMachineData } from "@/hooks/useMachineData";
import { useApiCall } from "@/hooks/useApiCall";

import PageContainer from "@/components/layout/PageContainer";

// Composants communs
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import CriticalAlert from "@/components/common/CriticalAlert";

// Composants spécifiques machine
import MachineHeader from "@/components/machine/MachineHeader";
import GeneralInfo from "@/components/machine/GeneralInfo";
import {
  InterventionsBlock,
  TimeSpentBlock,
  PurchaseRequestsBlock,
  PreventiveSuggestionsBlock,
  filterDecisionalInterventions,
  getTimeSpentInPeriod,
  getMachineRequests,
  hasUrgentAlert
} from './MachineDetail/MachineDetailBlocks';

// Utilitaires
import { stock } from "@/lib/api/facade";

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

  const timeSpentLast90Days = useMemo(
    () => getTimeSpentInPeriod(actions, 90 * 24 * 60 * 60 * 1000),
    [actions]
  );

  // Déterminer s'il y a une alerte urgente
  const urgentAlert = useMemo(
    () => hasUrgentAlert(decisionalInterventions),
    [decisionalInterventions]
  );

  // Stabilisation référence reload
  const handleReload = useCallback(() => {
    reload();
  }, [reload]);

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
      <Flex direction="column" gap="5">
        <MachineHeader 
          machine={machine} 
          globalStatus={urgentAlert ? 'critical' : 'ok'} 
          onReload={handleReload} 
        />

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
        <InterventionsBlock interventions={decisionalInterventions} machineId={id} />
        <Separator size="3" />

        {/* BLOC 2: TEMPS PASSÉ */}
        <TimeSpentBlock 
          timeSpent30d={timeSpentLast30Days}
          timeSpent90d={timeSpentLast90Days}
        />
        <Separator size="3" />

        {/* BLOC 3: DEMANDES D&apos;ACHAT */}
        {machineRequests.length > 0 && (
          <>
            <PurchaseRequestsBlock 
              requests={machineRequests}
              stockItems={stockItems}
              loading={requestsLoading}
            />
            <Separator size="3" />
          </>
        )}

        {/* BLOC 4: PRÉVENTIF */}
        <PreventiveSuggestionsBlock 
          machineId={id}
          hasRequests={machineRequests.length > 0}
        />
      </Flex>
    </PageContainer>
  );
}