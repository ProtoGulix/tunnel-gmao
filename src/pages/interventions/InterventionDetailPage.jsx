/**
 * Page de détail d'une intervention
 *
 * Affiche le détail complet d'une intervention avec :
 * - Header dynamique avec dropdowns statut/priorité
 * - 4 onglets : Actions, Résumé, Fiche et Historique
 * - Auto-refresh toutes les 30s
 */

import { lazy, Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertDialog, Button, Tabs, Box, Badge, Flex, Text, Callout } from '@radix-ui/themes';
import { Wrench, Activity, FileText, History, TrendingUp, ShoppingCart, Trash2, ListTodo } from 'lucide-react';
import { useInterventionDetail } from '@/hooks/interventions/useInterventionDetail';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import DropdownButton from '@/components/ui/DropdownButton';
import { STATE_COLORS, PRIORITY_COLORS } from '@/config/interventionTypes';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

const ActionsTab = lazy(() => import('@/components/interventions/tabs/ActionsTab'));
const SummaryTab = lazy(() => import('@/components/interventions/tabs/SummaryTab'));
const SheetTab = lazy(() => import('@/components/interventions/tabs/SheetTab'));
const HistoryTab = lazy(() => import('@/components/interventions/tabs/HistoryTab'));
const InterventionPurchaseTab = lazy(() => import('@/components/interventions/tabs/InterventionPurchaseTab'));
const InterventionRequestCard = lazy(() => import('@/components/intervention-requests/InterventionRequestCard'));
const TasksTab = lazy(() => import('@/components/interventions/tabs/TasksTab'));

// Configuration de base des onglets
const BASE_TABS = [
  { id: 'actions', label: 'Actions', icon: Activity, badgeCount: (actions, statusLog) => actions.length + (statusLog?.length || 0) },
  { id: 'taches', label: 'Tâches', icon: ListTodo, badgeCount: null },
  { id: 'achats', label: 'Achats', icon: ShoppingCart },
  { id: 'summary', label: 'Résumé', icon: TrendingUp },
  { id: 'fiche', label: 'Fiche', icon: FileText },
  { id: 'history', label: 'Historique', icon: History },
];

/**
 * Maps priority value to config key for UI display
 */
const mapPriorityToConfigKey = (priorityValue) => {
  if (!priorityValue) return 'normal';
  const key = priorityValue.toLowerCase().trim();
  return key === 'urgent' ? 'urgent'
    : key === 'important' ? 'important'
    : key === 'faible' ? 'faible'
    : 'normal';
};

/**
 * Maps domain DTO status to config key for UI display
 */
const mapDtoStatusToConfigKey = (dtoStatus) => {
  const statusId = dtoStatus?.id || dtoStatus;
  return statusId || 'ouvert';
};

/* eslint-disable complexity, max-lines */
export default function InterventionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') ?? 'actions');
  const [mutationError, setMutationError] = useState('');

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setSearchParams((prev) => { prev.set('tab', tab); return prev; }, { replace: true });
  }, [setSearchParams]);
  const [searchActions, setSearchActions] = useState('');

  const {
    intervention,
    loading,
    error,
    refetch,
    updateStatus,
    updateIntervention,
    addAction,
    deleteIntervention,
    statusLog,
    actions,
    pdfUrl,
    pdfLoading,
    loadPdf,
    ficheFileName,
  } = useInterventionDetail(id);

  const tabs = useMemo(() => BASE_TABS, []);

  // Charger le PDF quand l'onglet fiche est ouvert
  useEffect(() => {
    if (activeTab === 'fiche' && !pdfUrl && !pdfLoading) {
      loadPdf();
    }
  }, [activeTab, pdfUrl, pdfLoading, loadPdf]);

  const handleStatusChange = useCallback(
    async (newStatus) => {
      try {
        setMutationError('');
        await updateStatus(newStatus);
      } catch (err) {
        setMutationError(extractApiErrorMessage(err, 'Erreur lors de la modification'));
      }
    },
    [updateStatus]
  );

  const handlePriorityChange = useCallback(
    async (newPriority) => {
      try {
        setMutationError('');
        await updateIntervention({ priority: newPriority });
      } catch (err) {
        setMutationError(extractApiErrorMessage(err, 'Erreur lors de la modification'));
      }
    },
    [updateIntervention]
  );

  const handleMarkPrinted = useCallback(async () => {
    try {
      setMutationError('');
      await updateIntervention({ printedFiche: true });
    } catch (err) {
      setMutationError(extractApiErrorMessage(err, 'Erreur marquage imprimé'));
    }
  }, [updateIntervention]);

  const handlePurchaseRequestCreated = useCallback(() => {
    // Rafraîchir l'intervention pour mettre à jour la liste des demandes d'achat
    refetch();
  }, [refetch]);

  const handleDelete = useCallback(async () => {
    try {
      setMutationError('');
      await deleteIntervention();
      navigate('/interventions');
    } catch (err) {
      setMutationError(extractApiErrorMessage(err, 'Erreur suppression intervention'));
    }
  }, [deleteIntervention, navigate]);

  // Error state
  if (error && !intervention) {
    return (
      <PageContainer>
        <ErrorState
          error={error}
          onRetry={refetch}
          backLink="/interventions"
          backLabel="Retour aux interventions"
        />
      </PageContainer>
    );
  }

  // Loading initial
  if (loading && !intervention) {
    return (
      <PageContainer>
        <Box mt="4">
          <LoadingState message="Chargement de l'intervention..." />
        </Box>
      </PageContainer>
    );
  }

  if (!intervention) {
    return (
      <PageContainer>
        <ErrorState
          error="Intervention non trouvée"
          backLink="/interventions"
          backLabel="Retour aux interventions"
        />
      </PageContainer>
    );
  }

  const stats = intervention.stats || {};
  const isDeletable = !stats.actionCount && !stats.purchaseCount;
  const isLocked = ['ferme', 'cancelled'].includes(mapDtoStatusToConfigKey(intervention?.status));

  return (
    <PageContainer style={{ paddingBottom: '4rem' }}>
      <PageHeader
        icon={Wrench}
        title={`${intervention.machine?.name || 'Machine'} • ${intervention.code || `INT-${id}`}`}
        subtitle={intervention.title || 'Intervention'}
        stats={[
          { label: 'Actions', value: stats.actionCount || 0 },
          { label: 'Temps', value: `${stats.totalTime || 0}h` },
        ]}
        actions={[
          ...(isDeletable ? [{
            label: (
              <AlertDialog.Root>
                <AlertDialog.Trigger>
                  <Button color="red" variant="soft" size="2">
                    <Trash2 size={14} />
                    Supprimer
                  </Button>
                </AlertDialog.Trigger>
                <AlertDialog.Content maxWidth="420px">
                  <AlertDialog.Title>Supprimer l&apos;intervention</AlertDialog.Title>
                  <AlertDialog.Description>
                    Confirmer la suppression de <strong>{intervention.code}</strong> ? Cette action est irréversible.
                  </AlertDialog.Description>
                  <Flex gap="3" mt="4" justify="end">
                    <AlertDialog.Cancel>
                      <Button variant="soft" color="gray">Annuler</Button>
                    </AlertDialog.Cancel>
                    <AlertDialog.Action>
                      <Button color="red" onClick={handleDelete}>Supprimer</Button>
                    </AlertDialog.Action>
                  </Flex>
                </AlertDialog.Content>
              </AlertDialog.Root>
            ),
          }] : []),
          {
            label: (
              <DropdownButton
                label={
                  STATE_COLORS[mapDtoStatusToConfigKey(intervention.status)]?.label ||
                  'En cours'
                }
                color={
                  STATE_COLORS[mapDtoStatusToConfigKey(intervention.status)]?.activeBg ||
                  'var(--blue-6)'
                }
                textColor={
                  STATE_COLORS[mapDtoStatusToConfigKey(intervention.status)]?.textActive ||
                  'white'
                }
                disabled={isLocked}
                items={[
                  {
                    label: STATE_COLORS.ouvert.label,
                    color: STATE_COLORS.ouvert.activeBg,
                    onClick: () => handleStatusChange('ouvert'),
                  },
                  {
                    label: STATE_COLORS.attente_pieces.label,
                    color: STATE_COLORS.attente_pieces.activeBg,
                    onClick: () => handleStatusChange('attente_pieces'),
                  },
                  {
                    label: STATE_COLORS.attente_prod.label,
                    color: STATE_COLORS.attente_prod.activeBg,
                    onClick: () => handleStatusChange('attente_prod'),
                  },
                  {
                    label: STATE_COLORS.ferme.label,
                    color: STATE_COLORS.ferme.activeBg,
                    onClick: () => handleStatusChange('ferme'),
                  },
                ]}
              />
            ),
          },
          {
            label: (
              <DropdownButton
                label={
                  PRIORITY_COLORS[mapPriorityToConfigKey(intervention.priority)]?.label ||
                  'Normal'
                }
                color={
                  PRIORITY_COLORS[mapPriorityToConfigKey(intervention.priority)]?.activeBg ||
                  'var(--gray-6)'
                }
                textColor={
                  PRIORITY_COLORS[mapPriorityToConfigKey(intervention.priority)]?.textActive ||
                  'white'
                }
                disabled={isLocked}
                items={[
                  {
                    label: 'Urgent',
                    color: PRIORITY_COLORS.urgent.activeBg,
                    onClick: () => handlePriorityChange('urgent'),
                  },
                  {
                    label: 'Important',
                    color: PRIORITY_COLORS.important.activeBg,
                    onClick: () => handlePriorityChange('important'),
                  },
                  {
                    label: 'Normal',
                    color: PRIORITY_COLORS.normal.activeBg,
                    onClick: () => handlePriorityChange('normal'),
                  },
                  {
                    label: 'Faible',
                    color: PRIORITY_COLORS.faible.activeBg,
                    onClick: () => handlePriorityChange('faible'),
                  },
                ]}
              />
            ),
          },
        ]}
      />

      {/* Demande liée */}
      <Box mt="4">
        <Suspense fallback={null}>
          <InterventionRequestCard request={intervention.request ?? null} />
        </Suspense>
      </Box>

      {/* TABS */}
      <Tabs.Root
        value={activeTab}
        onValueChange={handleTabChange}
        style={{ marginTop: '2rem' }}
      >

      {mutationError && (
        <Box mt="3">
          <Callout.Root color="red" size="1" role="alert" aria-live="polite">
            <Callout.Text>{mutationError}</Callout.Text>
          </Callout.Root>
        </Box>
      )}
        <Tabs.List style={{ borderBottom: '1px solid var(--gray-6)' }}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const badgeValue = tab.badgeCount
              ? tab.badgeCount(actions, statusLog)
              : null;

            return (
              <Tabs.Trigger key={tab.id} value={tab.id}>
                <Flex align="center" gap="2">
                  <Icon size={16} />
                  <Text>{tab.label}</Text>
                  {badgeValue !== null && badgeValue > 0 && (
                    <Badge color="blue" variant="soft" size="1">
                      {badgeValue}
                    </Badge>
                  )}
                </Flex>
              </Tabs.Trigger>
            );
          })}
        </Tabs.List>

        <Suspense fallback={<LoadingState />}>
          <Tabs.Content value="actions">
            <ActionsTab
              actions={actions}
              statusLog={statusLog}
              searchTerm={searchActions}
              onSearchChange={setSearchActions}
              onAddAction={isLocked ? null : addAction}
              interventionId={id}
              onPurchaseRequestCreated={handlePurchaseRequestCreated}
              planId={intervention.plan_id ?? null}
              isLocked={isLocked}
            />
          </Tabs.Content>

          <Tabs.Content value="taches">
            <TasksTab interventionId={id} isLocked={isLocked} />
          </Tabs.Content>

          <Tabs.Content value="achats">
            <InterventionPurchaseTab interventionId={id} isLocked={isLocked} />
          </Tabs.Content>

          <Tabs.Content value="summary">
            <SummaryTab intervention={intervention} loading={loading} />
          </Tabs.Content>

          <Tabs.Content value="fiche">
            <SheetTab
              pdfUrl={pdfUrl}
              pdfLoading={pdfLoading}
              printedFiche={intervention.printedFiche}
              fileName={ficheFileName}
              onMarkPrinted={isLocked ? null : handleMarkPrinted}
            />
          </Tabs.Content>

          <Tabs.Content value="history">
            <HistoryTab actions={actions} statusLog={statusLog} />
          </Tabs.Content>
        </Suspense>
      </Tabs.Root>
    </PageContainer>
  );
}
