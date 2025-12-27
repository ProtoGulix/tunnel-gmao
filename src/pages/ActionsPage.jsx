import { useEffect, useState, useMemo } from "react";
import { actions } from "@/lib/api/facade";
import { useApiCall } from "@/hooks/useApiCall";
import LoadingState from "@/components/common/LoadingState";
import ErrorDisplay from "@/components/ErrorDisplay";
import {
  Container,
  Flex,
  Box,
  Card,
  Heading,
  Text,
  Button,
  Tabs,
  Badge,
  IconButton
} from "@radix-ui/themes";

// Composants
import PageHeader from "@/components/layout/PageHeader";
import ActionStatsCards from "@/components/actions/ActionStatsCards";
import LoadAnalysisTable from "@/components/actions/LoadAnalysisTable";
import TopInterventionsTable from "@/components/actions/TopInterventionsTable";
import AnomaliesPanel from "@/components/actions/AnomaliesPanel";
import ActionsList from "@/components/actions/ActionsList";

// Configuration
import { usePageHeaderProps } from "@/hooks/usePageConfig";
// Layout
import PageContainer from "@/components/layout/PageContainer";

// Utilitaires
import { 
  calculateActionStats,
  filterActionsByDateRange,
  getComplexityBadge,
  getLoadPriorityBadge,
  getRecurrenceBadge
} from "@/lib/utils/actionUtils";

/**
 * Page principale de gestion des actions
 * Affiche la liste des actions avec analyse de charge
 */
export default function ActionsPage() {
  // ==================== STATE ====================
  const [filteredActions, setFilteredActions] = useState([]);
  const [dateRange, setDateRange] = useState(null);
  const [activeTab, setActiveTab] = useState("list");

  // ✅ Utiliser le hook useApiCall
  const { 
    data: allActions = [], 
    loading, 
    error, 
    execute: refetchActions 
  } = useApiCall(actions.fetchActions);

  // ==================== COMPUTED VALUES ====================

  const stats = useMemo(() => {
    if (!filteredActions || !Array.isArray(filteredActions)) {
      return { totalActions: 0, totalTime: 0, categoriesCount: 0, categories: [], topInterventions: [], anomalies: null };
    }
    return calculateActionStats(filteredActions);
  }, [filteredActions]);

  const totalTimeSpent = useMemo(() => {
    if (!filteredActions || !Array.isArray(filteredActions)) {
      return 0;
    }
    return filteredActions.reduce((sum, action) => {
      return sum + (parseFloat(action.timeSpent) || 0);
    }, 0);
  }, [filteredActions]);

  const totalAnomalies = useMemo(() => {
    if (!stats.anomalies) return 0;
    return Object.values(stats.anomalies).reduce((sum, arr) => {
      return sum + (Array.isArray(arr) ? arr.length : 0);
    }, 0);
  }, [stats.anomalies]);

  // ==================== LIFECYCLE & EFFECTS ====================

  useEffect(() => {
    refetchActions();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      refetchActions();
    }, 5 * 60 * 1000); // Refresh toutes les 5 minutes
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (dateRange) {
      const filtered = filterActionsByDateRange(allActions, dateRange);
      setFilteredActions(filtered);
    } else {
      setFilteredActions(allActions);
    }
  }, [dateRange, allActions]);

  // ==================== HANDLERS ====================

  /**
   * Gère le changement de période depuis HeaderDateRangeFilter
   * @param {{ range: {start: Date, end: Date} | null, key: string }} filterData
   */
  const handleDateRangeChange = ({ range }) => {
    setDateRange(range);
  };

  // ==================== RENDER: LOADING STATE ====================

  // Header props depuis la config centralisée
  const headerProps = usePageHeaderProps({
    subtitle: loading ? "Chargement en cours..." : error ? "Erreur de chargement" : `${filteredActions?.length || 0} action${(filteredActions?.length || 0) > 1 ? 's' : ''} • ${totalTimeSpent.toFixed(1)}h`,
    urgentBadge: totalAnomalies > 0 ? { 
      count: totalAnomalies, 
      label: `anomalie${totalAnomalies > 1 ? 's' : ''}` 
    } : null,
    stats: !loading && !error ? [
      { label: 'Actions', value: stats.totalActions },
      { label: 'Temps total', value: `${stats.totalTime}h` },
      { label: 'Catégories', value: stats.categoriesCount }
    ] : [],
    onRefresh: refetchActions,
    onAdd: () => console.log('Créer action'),
    addLabel: "+ Nouvelle action",
    timeSelection: {
      onFilterChange: handleDateRangeChange
    }
  });

  if (loading) {
    return (
      <Box>
        <PageHeader {...headerProps} />
        <PageContainer>
          <LoadingState message="Chargement des actions..." />
        </PageContainer>
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <PageHeader {...headerProps} />
        <PageContainer>
          <ErrorDisplay
            error={error}
            onRetry={refetchActions}
            title="Erreur de chargement des actions"
          />
        </PageContainer>
      </Box>
    );
  }

  // ==================== RENDER: MAIN VIEW ====================

  return (
    <Box>
      {/* PAGE HEADER depuis configuration centralisée */}
      <PageHeader {...headerProps} />

      <Container size="4" p="3">
        <Flex direction="column" gap="3">
          
          {/* ========== STATISTICS CARDS ========== */}
          <ActionStatsCards 
            stats={stats} 
            totalAnomalies={totalAnomalies} 
          />

          {/* ========== MAIN CONTENT TABS ========== */}
          <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
            <Tabs.List size="2" mb="3">
              <Tabs.Trigger value="list">
                <Flex align="center" gap="2">
                  <Text>📋 Liste</Text>
                  <Badge color="blue" size="1" variant="soft">
                    {filteredActions?.length || 0}
                  </Badge>
                </Flex>
              </Tabs.Trigger>

              <Tabs.Trigger value="load">
                <Flex align="center" gap="2">
                  <Text>🔥 Analyse charge</Text>
                  <Badge color="amber" size="1" variant="soft">
                    {stats.categories.length}
                  </Badge>
                </Flex>
              </Tabs.Trigger>

              <Tabs.Trigger value="interventions">
                <Flex align="center" gap="2">
                  <Text>🔁 Top interventions</Text>
                  <Badge color="blue" size="1" variant="soft">
                    {stats.topInterventions.length}
                  </Badge>
                </Flex>
              </Tabs.Trigger>

              {stats.anomalies && (
                <Tabs.Trigger value="anomalies">
                  <Flex align="center" gap="2">
                    <Text>⚠️ Anomalies</Text>
                    <Badge color="red" size="1" variant="solid">
                      {totalAnomalies}
                    </Badge>
                  </Flex>
                </Tabs.Trigger>
              )}
            </Tabs.List>

            {/* ========== TAB: LISTE DES ACTIONS ========== */}
            <Tabs.Content value="list">
              <ActionsList 
                actions={filteredActions}
                onDateRangeChange={setDateRange}
              />
            </Tabs.Content>

            {/* ========== TAB: ANALYSE DE CHARGE ========== */}
            <Tabs.Content value="load">
              <LoadAnalysisTable 
                categories={stats.categories}
                getComplexityBadge={getComplexityBadge}
                getLoadPriorityBadge={getLoadPriorityBadge}
              />
            </Tabs.Content>

            {/* ========== TAB: TOP INTERVENTIONS ========== */}
            <Tabs.Content value="interventions">
              <TopInterventionsTable 
                interventions={stats.topInterventions}
                getRecurrenceBadge={getRecurrenceBadge}
                getComplexityBadge={getComplexityBadge}
              />
            </Tabs.Content>

            {/* ========== TAB: ANOMALIES ========== */}
            {stats.anomalies && (
              <Tabs.Content value="anomalies">
                <AnomaliesPanel anomalies={stats.anomalies} />
              </Tabs.Content>
            )}
          </Tabs.Root>
        </Flex>
      </Container>
    </Box>
  );
}