// ===== IMPORTS =====
// 1. React Core
import { useState } from 'react';

// 2. UI Libraries (Radix)
import { Box, Flex, Tabs, Text, Card, Button, Heading, Table, Badge } from '@radix-ui/themes';
import { AlertCircle, ClipboardList, Settings } from 'lucide-react';

// 3. Custom Components
import PageHeader from '@/components/layout/PageHeader';
import PageContainer from '@/components/layout/PageContainer';
import LoadingState from '@/components/common/LoadingState';
import ErrorDisplay from '@/components/ErrorDisplay';
import StatusFilterBar from '@/components/preventive/StatusFilterBar';
import PreventiveSuggestionRow from '@/components/preventive/PreventiveSuggestionRow';
import EmptyState from '@/components/common/EmptyState';

// 4. Custom Hooks
import { useApiCall } from '@/hooks/useApiCall';
import { useAuth } from '@/auth/AuthContext';
import { usePageHeaderProps } from '@/hooks/usePageConfig';

// 5. API & Utilities
import { preventive } from '@/lib/api/facade';
import { useNavigate } from 'react-router-dom';

// ===== CONSTANTS =====
const STATUS_DISPLAY = {
  NEW: { label: 'En attente', color: 'blue' },
  REVIEWED: { label: 'Examinée', color: 'gray' },
  ACCEPTED: { label: 'Acceptée', color: 'green' },
  REJECTED: { label: 'Rejetée', color: 'red' },
};

const MESSAGES = {
  LOADING: 'Chargement des données préventives...',
  EMPTY: 'Aucune préconisation active',
  ERROR: 'Erreur lors du chargement',
  ACCEPT_SUCCESS: 'Préconisation acceptée',
  REJECT_SUCCESS: 'Préconisation rejetée',
};

const PREVENTIVE_TABS = {
  SUGGESTIONS: 'suggestions',
  RULES: 'rules',
  CONFIG: 'config',
};

// ===== COMPONENT =====
/**
 * Page de gestion du préventif
 * 
 * Gestion complète du système de maintenance préventive :
 * - Préconisations : suggestions automatiques détectées
 * - Règles : configuration des règles de détection
 * - Configuration : paramétrage du système
 * 
 * Features:
 * - Tabs pour organiser les différentes vues
 * - Filtrage par statut des préconisations
 * - Actions sur les préconisations (accepter/rejeter)
 * - Navigation vers les machines concernées
 * - Backend-agnostic via facade pattern
 * 
 * @component
 * @returns {JSX.Element} Page de gestion du préventif
 */
export default function PreventiveSuggestionsPage() {
  // ----- State -----
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(PREVENTIVE_TABS.SUGGESTIONS);
  const [statusFilter, setStatusFilter] = useState('NEW');
  const [processing, setProcessing] = useState(null);
  const [message, setMessage] = useState(null);

  // ----- API Calls -----
  const { data: suggestions, loading, error, execute: refresh } = useApiCall(
    () => preventive.fetchAllPreventiveSuggestions(statusFilter),
    { autoExecute: true, dependencies: [statusFilter] }
  );

  // ----- Page Config -----
  const headerProps = usePageHeaderProps('preventive-management');

  // ----- Handlers -----
  const handleSuggestionAction = async (suggestionId, action) => {
    if (!user?.id) return;
    setProcessing(suggestionId);
    try {
      if (action === 'accept') {
        await preventive.acceptPreventiveSuggestion(suggestionId, user.id);
        setMessage(MESSAGES.ACCEPT_SUCCESS);
      } else {
        await preventive.rejectPreventiveSuggestion(suggestionId, user.id);
        setMessage(MESSAGES.REJECT_SUCCESS);
      }
      await refresh();
      setTimeout(() => setMessage(null), 2000);
    } catch (err) {
      console.error(`Erreur ${action}:`, err);
      setMessage(`Erreur: ${err.message}`);
    } finally {
      setProcessing(null);
    }
  };

  const handleAccept = (suggestionId) => handleSuggestionAction(suggestionId, 'accept');
  const handleReject = (suggestionId) => handleSuggestionAction(suggestionId, 'reject');

  const handleStatusFilterChange = (newStatus) => {
    setStatusFilter(newStatus);
    setTimeout(() => refresh(), 0);
  };

  const goToMachine = (machineId) => {
    navigate(`/machines/${machineId}`);
  };

  // ----- Computed Values -----
  const shouldShowTable = suggestions && suggestions.length > 0;
  const shouldShowEmpty = !suggestions || suggestions.length === 0;

  // ----- Early Returns -----
  if (loading) return <LoadingState message={MESSAGES.LOADING} />;
  if (error) return <ErrorDisplay error={error} />;

  // ----- Render -----
  return (
    <PageContainer>
      <PageHeader {...headerProps} />

      <Box px="6" py="4">
        <Tabs.Root value={activeTab} onValueChange={setActiveTab}>
          {/* Tabs Header */}
          <Tabs.List>
            <Tabs.Trigger value={PREVENTIVE_TABS.SUGGESTIONS}>
              <Flex align="center" gap="2">
                <ClipboardList size={16} />
                <Text>Préconisations</Text>
                {suggestions?.length > 0 && (
                  <Badge color="blue" size="1">
                    {suggestions.length}
                  </Badge>
                )}
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value={PREVENTIVE_TABS.RULES}>
              <Flex align="center" gap="2">
                <AlertCircle size={16} />
                <Text>Règles</Text>
              </Flex>
            </Tabs.Trigger>
            <Tabs.Trigger value={PREVENTIVE_TABS.CONFIG}>
              <Flex align="center" gap="2">
                <Settings size={16} />
                <Text>Configuration</Text>
              </Flex>
            </Tabs.Trigger>
          </Tabs.List>

          {/* Tab: Préconisations */}
          <Tabs.Content value={PREVENTIVE_TABS.SUGGESTIONS}>
            <Box mt="4">
              {/* Filtres de statut */}
              <StatusFilterBar currentStatus={statusFilter} onChange={handleStatusFilterChange} />

              {/* Message feedback */}
              {message && (
                <Box
                  mb="3"
                  p="3"
                  style={{
                    backgroundColor: 'var(--color-blue-2)',
                    borderRadius: 'var(--radius-2)',
                    borderLeft: '4px solid var(--color-blue-9)',
                  }}
                >
                  <Text size="sm" color="blue">
                    {message}
                  </Text>
                </Box>
              )}

              {/* Empty state */}
              {shouldShowEmpty && (
                <EmptyState
                  icon={ClipboardList}
                  message={MESSAGES.EMPTY}
                  description="Aucune préconisation détectée pour le moment"
                />
              )}

              {/* Table */}
              {shouldShowTable && (
                <Card>
                  <Table.Root variant="surface">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeaderCell>Statut</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Machine</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Préconisation</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Score</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Détecté le</Table.ColumnHeaderCell>
                        <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {suggestions.map((suggestion) => (
                        <PreventiveSuggestionRow
                          key={suggestion.id}
                          suggestion={suggestion}
                          onAccept={handleAccept}
                          onReject={handleReject}
                          onGoToMachine={goToMachine}
                          processing={processing === suggestion.id}
                        />
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Card>
              )}
            </Box>
          </Tabs.Content>

          {/* Tab: Règles */}
          <Tabs.Content value={PREVENTIVE_TABS.RULES}>
            <Box mt="4">
              <Card>
                <Flex direction="column" gap="3" p="4">
                  <Heading size="4">Règles de détection</Heading>
                  <Text color="gray">
                    Configuration des règles de maintenance préventive (à venir)
                  </Text>
                </Flex>
              </Card>
            </Box>
          </Tabs.Content>

          {/* Tab: Configuration */}
          <Tabs.Content value={PREVENTIVE_TABS.CONFIG}>
            <Box mt="4">
              <Card>
                <Flex direction="column" gap="3" p="4">
                  <Heading size="4">Configuration du système</Heading>
                  <Text color="gray">
                    Paramétrage du système de maintenance préventive (à venir)
                  </Text>
                </Flex>
              </Card>
            </Box>
          </Tabs.Content>
        </Tabs.Root>
      </Box>
    </PageContainer>
  );
}
