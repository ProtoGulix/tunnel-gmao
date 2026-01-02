/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * 📄 MachineDetail.jsx - Page de détail complète d'une machine
 * ═══════════════════════════════════════════════════════════════════════════════
 * 
 * Page orchestratrice affichant toutes les informations et statistiques d'une machine:
 * - Informations générales (zone, atelier, hiérarchie)
 * - KPIs de disponibilité et performance
 * - Analyses des temps passés (top activités, techniciens, types)
 * - Interventions ouvertes avec actions en cours
 * - Historique 30/90 jours avec navigation vers liste complète
 * 
 * Architecture:
 * - Hooks customs: useMachineData (chargement), useMachineStats (calculs)
 * - Composants spécialisés: Header, KPIs, distributions, tables
 * - États: Loading/Error avec retry, CriticalAlert si machine critique
 * - Performance: useMemo pour filtrage interventions, stats calculées dans hook
 * 
 * ✅ IMPLÉMENTÉ:
 * - Chargement données machine + interventions + actions + subcategories
 * - Calcul automatique KPIs (disponibilité, temps passés, complexité moyenne)
 * - Grille responsive KPIs (2 cols mobile, 4 cols desktop)
 * - CriticalAlert avec severity error si globalStatus === 'critical'
 * - Filtrage mémoïsé interventions ouvertes (isInterventionOpen)
 * - Navigation vers historique complet avec filtres pré-remplis
 * - Reload capability avec callback onRetry sur ErrorState
 * 
 * 📋 TODO:
 * - [ ] Export PDF rapport complet machine (KPIs + interventions + historique)
 * - [ ] Mode comparaison (sélectionner 2+ machines, overlay KPIs)
 * - [ ] Timeline visuelle interventions (Gantt chart avec période zoom)
 * - [ ] Prédiction maintenance préventive (ML sur historique pannes)
 * - [ ] Graphique évolution disponibilité dans le temps (30/90/365j)
 * - [ ] Alertes configurables (seuils disponibilité, nb interventions, temps passé)
 * - [ ] Indicateur coût total maintenance (pièces + main d'oeuvre)
 * - [ ] Badge "Machine sous garantie" avec date expiration
 * - [ ] Section fichiers attachés (manuels, photos, schémas techniques)
 * - [ ] QR code pour accès mobile rapide depuis étiquette machine
 * - [ ] Mode impression optimisé (CSS @media print, masquer actions)
 * - [ ] Favoris/bookmarks machines (localStorage, icône étoile header)
 * - [ ] Notifications push si nouvelle intervention ajoutée
 * - [ ] Skeleton loading granulaire (KPIs apparaissent progressivement)
 * 
 * @module pages/MachineDetail
 * @requires hooks/useMachineData - Chargement données machine
 * @requires hooks/useMachineStats - Calculs statistiques
 * @requires utils/interventionHelpers - isInterventionOpen, statuts
 * @requires utils/timeFormatter - formatTime pour affichage durées
 */

import { useParams } from "react-router-dom";
import { useMemo, useCallback } from "react";
import { Flex, Grid, Separator } from "@radix-ui/themes";

// Hooks
import { useMachineData } from "@/hooks/useMachineData";
import { useMachineStats } from "@/hooks/useMachineStats";

import PageContainer from "@/components/layout/PageContainer";

// Composants communs
import LoadingState from "@/components/common/LoadingState";
import ErrorState from "@/components/common/ErrorState";
import KPICard from "@/components/common/KPICard";
import CriticalAlert from "@/components/common/CriticalAlert";

// Composants spécifiques machine
import MachineHeader from "@/components/machine/MachineHeader";
import GeneralInfo from "@/components/machine/GeneralInfo";
import TopActivities from "@/components/machine/TopActivities";
import TechnicianDistribution from "@/components/machine/TechnicianDistribution";
import ActivityPeriod from "@/components/machine/ActivityPeriod";
import InterventionTypeDistribution from "@/components/machine/InterventionTypeDistribution";
import PriorityDistribution from "@/components/machine/PriorityDistribution";
import OpenInterventionsTable from "@/components/machine/OpenInterventionsTable";
import HistoricalSummary from "@/components/machine/HistoricalSummary";

// Utilitaires
import { formatTime } from "@/lib/utils/timeFormatter";
import { isInterventionOpen } from "@/lib/utils/interventionHelpers";

/**
 * Filtre les interventions ouvertes d'une liste
 * Exporté pour réutilisation dans d'autres pages/tests
 * 
 * @param {Array} interventions - Liste des interventions à filtrer
 * @returns {Array} Interventions avec statut ouvert uniquement
 * @example
 * const openOnly = filterOpenInterventions(allInterventions); // => [{status: 'open', ...}]
 */
export const filterOpenInterventions = (interventions) => 
  interventions.filter(isInterventionOpen);

/**
 * Page de détail d'une machine avec toutes ses statistiques et interventions
 * 
 * Affiche les KPIs de performance, analyses des temps passés par activité/technicien,
 * répartitions par type/priorité, interventions ouvertes, et historique 30/90 jours.
 * 
 * @returns {JSX.Element} Page complète avec orchestration des composants machine
 */
export default function MachineDetail() {
  const { id } = useParams();
  
  // Chargement des données
  const { 
    machine, 
    interventions, 
    actions, 
    subcategories, 
    loading, 
    error, 
    reload 
  } = useMachineData(id);

  // Calcul des statistiques
  const stats = useMachineStats(interventions, actions, subcategories);

  // Filtrage des interventions ouvertes (mémoïsé pour optimisation)
  const openInterventions = useMemo(
    () => filterOpenInterventions(interventions),
    [interventions]
  );

  // Stabilisation référence reload pour éviter re-renders enfants
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
      <Flex direction="column" gap="3">
        {/* En-tête avec état de la machine */}
        <MachineHeader 
          machine={machine} 
          globalStatus={stats.globalStatus} 
          onReload={handleReload} 
        />

        {/* Alerte si la machine est en état critique */}
        <CriticalAlert 
          show={stats.globalStatus === 'critical'}
          title="⚠️ Machine critique"
          message="Cette machine nécessite une attention immédiate."
          severity="error"
        />

        {/* Informations générales de la machine */}
        <GeneralInfo machine={machine} />

        {/* KPIs principaux */}
        <Grid columns={{ initial: '2', md: '4' }} gap="3">
          <KPICard 
            label="Disponibilité"
            value={`${stats.availabilityRate.toFixed(1)}%`}
            progress={stats.availabilityRate}
          />
          
          <KPICard 
            label="Interventions ouvertes"
            value={stats.open}
            subtitle={`sur ${stats.total} total`}
            color={stats.open > 0 ? 'orange' : 'green'}
          />

          <KPICard 
            label="Temps total passé"
            value={formatTime(stats.totalTimeSpent)}
            subtitle={`${stats.totalActions} actions`}
            color="blue"
          />

          <KPICard 
            label="Temps moyen / intervention"
            value={formatTime(stats.avgTimePerIntervention)}
            subtitle={`Complexité moy: ${stats.avgComplexity.toFixed(1)}`}
          />
        </Grid>

        {/* Analyse des temps passés */}
        <TopActivities 
          topSubcategories={stats.topSubcategories} 
          totalTime={stats.totalTimeSpent} 
        />

        {/* Répartition par technicien */}
        <TechnicianDistribution 
          timeByTech={stats.timeByTech} 
          totalTime={stats.totalTimeSpent} 
        />

        {/* Activité récente */}
        <ActivityPeriod 
          interventionCount={stats.last30Days}
          timeSpent={stats.last30DaysTime}
          periodDays={30}
          historicalCount={stats.last90Days}
        />

        {/* Répartition par type d'intervention */}
        <InterventionTypeDistribution 
          byType={stats.byType} 
          total={stats.total} 
        />

        {/* Répartition par priorité */}
        <PriorityDistribution byPriority={stats.byPriority} />

        <Separator size="4" />

        {/* Liste des interventions ouvertes */}
        <OpenInterventionsTable 
          interventions={openInterventions} 
          machineId={id} 
        />

        {/* Résumé historique */}
        <HistoricalSummary 
          count={stats.last90Days}
          machineId={id}
        />
      </Flex>
    </PageContainer>
  );
}