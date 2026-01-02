// ===== IMPORTS =====
// 1. React Core
import { useEffect, useState, useMemo, useCallback, useRef } from "react";

// 2. UI Libraries (Radix)
import {
  Container,
  Flex,
  Box,
  Tabs,
  Badge,
  Text
} from "@radix-ui/themes";

// 3. Custom Components
import PageHeader from "@/components/layout/PageHeader";
import PageContainer from "@/components/layout/PageContainer";
import LoadingState from "@/components/common/LoadingState";
import ErrorDisplay from "@/components/ErrorDisplay";
import ActionStatsCards from "@/components/actions/ActionStatsCards";
import LoadAnalysisTable from "@/components/actions/LoadAnalysisTable";
import TopInterventionsTable from "@/components/actions/TopInterventionsTable";
import AnomaliesPanel from "@/components/actions/AnomaliesPanel";
import ActionsList from "@/components/actions/ActionsList/";

// 5. Custom Hooks
import { useApiCall } from "@/hooks/useApiCall";
import { usePageHeaderProps } from "@/hooks/usePageConfig";
import { useAnomalyConfig } from "@/hooks/useAnomalyConfig";

// 6. API & Utilities
import { actions } from "@/lib/api/facade";
import { 
  calculateActionStats,
  filterActionsByDateRange,
  getComplexityBadge,
  getLoadPriorityBadge,
  getRecurrenceBadge
} from "@/lib/utils/actionUtils";

// 7. Config
import { ACTION_TABS } from "@/config/actionPageConfig";

// ===== COMPONENT =====
/**
 * Actions management page with workload analysis.
 * 
 * Displays the list of intervention actions with comprehensive statistics,
 * load analysis, top interventions ranking, and anomaly detection.
 * 
 * Features:
 * - List view with filtering and date range selection
 * - Load analysis by category with complexity and priority badges
 * - Top interventions ranking by recurrence and complexity
 * - Anomaly detection (6 types: repetitive, fragmented, too long, classification, back-to-back, low value)
 * - Auto-refresh every 5 minutes
 * - Backend-agnostic via facade pattern
 * 
 * @component
 * @returns {JSX.Element} Actions page with tabs (list, load analysis, top interventions, anomalies)
 * 
 * @example
 * <Route path="/actions" element={<ActionsPage />} />
 */
export default function ActionsPage() {
  // ----- State -----
  const [filteredActions, setFilteredActions] = useState([]);
  const [dateRange, setDateRange] = useState(null);
  const [activeTab, setActiveTab] = useState("list");
  const initialLoadRef = useRef(false);

  // ----- Anomaly Config -----
  const { loading: configLoading } = useAnomalyConfig();

  // ----- API Calls -----
  const { 
    data: allActions = [], 
    loading, 
    error, 
    execute: refetchActions 
  } = useApiCall(actions.fetchActions, { autoExecute: false });

  // ----- Computed Values -----
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

  // ----- Callbacks -----
  const handleDateRangeChange = useCallback(({ range }) => {
    setDateRange(range);
  }, []);

  const handleCreateAction = useCallback(() => {
    // TODO: Implement action creation flow
  }, []);

  // ----- Effects -----
  useEffect(() => {
    // Protection against React StrictMode double invocation
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    refetchActions();
  }, [refetchActions]);

  useEffect(() => {
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => {
      refetchActions();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [refetchActions]);

  useEffect(() => {
    if (dateRange) {
      const filtered = filterActionsByDateRange(allActions, dateRange);
      setFilteredActions(filtered);
    } else {
      setFilteredActions(allActions);
    }
  }, [dateRange, allActions]);

  // ----- Header Configuration -----
  const headerProps = usePageHeaderProps({
    subtitle: (loading || configLoading)
      ? "Loading..." 
      : error 
        ? "Loading error" 
        : `${filteredActions?.length || 0} action${(filteredActions?.length || 0) > 1 ? 's' : ''} • ${totalTimeSpent.toFixed(1)}h`,
    urgentBadge: totalAnomalies > 0 ? { 
      count: totalAnomalies, 
      label: `anomal${totalAnomalies > 1 ? 'ies' : 'y'}` 
    } : null,
    stats: (!loading && !error && !configLoading) ? [
      { label: 'Actions', value: stats.totalActions },
      { label: 'Total Time', value: `${stats.totalTime}h` },
      { label: 'Categories', value: stats.categoriesCount }
    ] : [],
    onRefresh: refetchActions,
    onAdd: handleCreateAction,
    addLabel: "+ New Action",
    timeSelection: {
      onFilterChange: handleDateRangeChange
    }
  });

  // ----- Render States -----

  if (loading || configLoading) {
    return (
      <Box>
        <PageHeader {...headerProps} />
        <PageContainer>
          <LoadingState message={configLoading ? "Loading configuration..." : "Loading actions..."} />
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
            title="Actions Loading Error"
          />
        </PageContainer>
      </Box>
    );
  }

  // ----- Main Render -----
  return (
    <Box>
      <PageHeader {...headerProps} />

      <Container size="4" p="3">
        <Flex direction="column" gap="3">
          {/* Statistics Cards */}
          <ActionStatsCards 
            stats={stats} 
            totalAnomalies={totalAnomalies} 
          />

          {/* Main Content Tabs */}
          <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
            <Tabs.List size="2" mb="3">
              {ACTION_TABS.map((tab) => {
                // Skip anomalies tab if no anomalies
                if (tab.conditional && (!stats.anomalies || Object.keys(stats.anomalies).length === 0)) {
                  return null;
                }

                const Icon = tab.icon;
                let badgeCount = 0;

                // Calculate badge count based on tab
                if (tab.value === "list") badgeCount = filteredActions?.length || 0;
                else if (tab.value === "load") badgeCount = stats.categories.length;
                else if (tab.value === "interventions") badgeCount = stats.topInterventions.length;
                else if (tab.value === "anomalies") badgeCount = totalAnomalies;

                return (
                  <Tabs.Trigger key={tab.value} value={tab.value}>
                    <Flex align="center" gap="2">
                      <Icon size={16} />
                      <Text>{tab.label}</Text>
                      <Badge 
                        color={tab.color} 
                        size="1" 
                        variant={tab.value === "anomalies" ? "solid" : "soft"}
                      >
                        {badgeCount}
                      </Badge>
                    </Flex>
                  </Tabs.Trigger>
                );
              })}
            </Tabs.List>

            {/* Tab: Actions List */}
            <Tabs.Content value="list">
              <ActionsList 
                actions={filteredActions}
                onDateRangeChange={setDateRange}
              />
            </Tabs.Content>

            {/* Tab: Load Analysis */}
            <Tabs.Content value="load">
              <LoadAnalysisTable 
                categories={stats.categories}
                getComplexityBadge={getComplexityBadge}
                getLoadPriorityBadge={getLoadPriorityBadge}
              />
            </Tabs.Content>

            {/* Tab: Top Interventions */}
            <Tabs.Content value="interventions">
              <TopInterventionsTable 
                interventions={stats.topInterventions}
                getRecurrenceBadge={getRecurrenceBadge}
                getComplexityBadge={getComplexityBadge}
              />
            </Tabs.Content>

            {/* Tab: Anomalies */}
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