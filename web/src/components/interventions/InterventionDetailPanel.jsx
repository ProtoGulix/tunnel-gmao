/**
 * Détail d'une intervention, affiché dans le panneau droit de la page Interventions
 * (master-detail). Seul affichage du détail depuis l'ADR 0014 : la page complète
 * /intervention/:id a été supprimée et redirige vers /interventions?id=.
 *
 * En-tête compact (ADR 0013) puis onglets : Actions, Tâches, Achats, Demande,
 * Résumé, Fiche et Historique.
 */

import { lazy, Suspense, useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import PropTypes from 'prop-types';
import { Tabs, Box, Badge, Flex, Text, Callout } from '@radix-ui/themes';
import { Activity, FileText, History, TrendingUp, ShoppingCart, ListTodo, ClipboardList } from 'lucide-react';
import { useInterventionDetail } from '@/hooks/interventions/useInterventionDetail';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import RequestPointageDialog from '@/components/interventions/RequestPointageDialog';
import InterventionPanelHeader from '@/components/interventions/InterventionPanelHeader';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';
import { useNotification } from '@/hooks/shared/useNotification';
import { usePermissions } from '@/auth/usePermissions';
import { PERM } from '@/auth/permissionCodes';

const ActionsTab = lazy(() => import('@/components/interventions/tabs/ActionsTab'));
const SummaryTab = lazy(() => import('@/components/interventions/tabs/SummaryTab'));
const SheetTab = lazy(() => import('@/components/interventions/tabs/SheetTab'));
const HistoryTab = lazy(() => import('@/components/interventions/tabs/HistoryTab'));
const InterventionPurchaseTab = lazy(() => import('@/components/interventions/tabs/InterventionPurchaseTab'));
const InterventionRequestDetail = lazy(() => import('@/components/intervention-requests/InterventionRequestDetail'));
const TasksTab = lazy(() => import('@/components/interventions/tabs/TasksTab'));

// Configuration de base des onglets
const BASE_TABS = [
  { id: 'actions', label: 'Actions', icon: Activity, badgeCount: (actions, statusLog) => actions.length + (statusLog?.length || 0) },
  { id: 'taches', label: 'Tâches', icon: ListTodo, badgeCount: null },
  { id: 'achats', label: 'Achats', icon: ShoppingCart },
  { id: 'demande', label: 'Demande', icon: ClipboardList },
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
export default function InterventionDetailPanel({ id, onDeleted, onRefreshList }) {
  const { can } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  // La page Interventions possède déjà `tab` pour ses propres onglets : le détail
  // utilise `dtab` pour éviter toute collision.
  const tabParamKey = 'dtab';
  const [activeTab, setActiveTab] = useState(() => searchParams.get(tabParamKey) ?? 'actions');
  const [mutationError, setMutationError] = useState('');
  const [pointageDialogOpen, setPointageDialogOpen] = useState(false);
  const { notification, notify } = useNotification();

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setSearchParams((prev) => { prev.set(tabParamKey, tab); return prev; }, { replace: true });
  }, [tabParamKey, setSearchParams]);
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

  const tabs = useMemo(
    () => (intervention?.request ? BASE_TABS : BASE_TABS.filter((tab) => tab.id !== 'demande')),
    [intervention?.request]
  );

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

  const handlePointageRequested = useCallback(() => {
    notify('Demande de pointage envoyée');
  }, [notify]);

  const handlePurchaseRequestCreated = useCallback(() => {
    // Rafraîchir l'intervention pour mettre à jour la liste des demandes d'achat
    refetch();
  }, [refetch]);

  const handleDelete = useCallback(async () => {
    try {
      setMutationError('');
      await deleteIntervention();
      onDeleted?.();
      onRefreshList?.();
    } catch (err) {
      setMutationError(extractApiErrorMessage(err, 'Erreur suppression intervention'));
    }
  }, [deleteIntervention, onDeleted, onRefreshList]);

  if (error && !intervention) return <ErrorState error={error} onRetry={refetch} />;
  if (loading && !intervention) return <LoadingState message="Chargement de l'intervention..." />;
  if (!intervention) return null;

  const stats = intervention.stats || {};
  const isDeletable = !stats.actionCount && !stats.purchaseCount;
  const isLocked = ['ferme', 'cancelled'].includes(mapDtoStatusToConfigKey(intervention?.status));

  const tabsContent = (
    <Tabs.Root value={activeTab} onValueChange={handleTabChange} style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {mutationError && (
        <Box mt="3">
          <Callout.Root color="red" size="1" role="alert" aria-live="polite">
            <Callout.Text>{mutationError}</Callout.Text>
          </Callout.Root>
        </Box>
      )}
      <Tabs.List style={{ borderBottom: '1px solid var(--gray-6)', flexShrink: 0 }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const badgeValue = tab.badgeCount ? tab.badgeCount(actions, statusLog) : null;
          return (
            <Tabs.Trigger key={tab.id} value={tab.id}>
              <Flex align="center" gap="2">
                <Icon size={16} />
                <Text>{tab.label}</Text>
                {badgeValue !== null && badgeValue > 0 && (
                  <Badge color="blue" variant="soft" size="1">{badgeValue}</Badge>
                )}
              </Flex>
            </Tabs.Trigger>
          );
        })}
      </Tabs.List>
      <Box
        px="4"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: activeTab === 'fiche' ? 'hidden' : 'auto',
          display: activeTab === 'fiche' ? 'flex' : 'block',
          flexDirection: 'column',
        }}
      >
        <Suspense fallback={<LoadingState />}>
          <Tabs.Content value="actions">
            <ActionsTab
              actions={actions}
              statusLog={statusLog}
              searchTerm={searchActions}
              onSearchChange={setSearchActions}
              onAddAction={isLocked || !can(PERM.interventions.createAction) ? null : addAction}
              interventionId={id}
              onPurchaseRequestCreated={handlePurchaseRequestCreated}
              onActionDeleted={refetch}
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
          {intervention.request && (
            <Tabs.Content value="demande">
              <InterventionRequestDetail requestId={intervention.request.id} onTransitionDone={refetch} />
            </Tabs.Content>
          )}
          <Tabs.Content value="summary">
            <SummaryTab intervention={intervention} loading={loading} />
          </Tabs.Content>
          <Tabs.Content
            value="fiche"
            style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}
          >
            <SheetTab
              pdfUrl={pdfUrl}
              pdfLoading={pdfLoading}
              printedFiche={intervention.printedFiche}
              fileName={ficheFileName}
              onMarkPrinted={isLocked ? null : handleMarkPrinted}
              fillHeight
            />
          </Tabs.Content>
          <Tabs.Content value="history">
            <HistoryTab actions={actions} statusLog={statusLog} />
          </Tabs.Content>
        </Suspense>
      </Box>
    </Tabs.Root>
  );

  const pointageDialog = (
    <RequestPointageDialog
      open={pointageDialogOpen}
      onOpenChange={setPointageDialogOpen}
      interventionId={id}
      defaultTechId={intervention.tech_id ?? null}
      onSuccess={handlePointageRequested}
    />
  );

  const notificationToast = notification && (
    <Box mt="3">
      <Callout.Root color={notification.type === 'error' ? 'red' : 'green'} size="1" role="status" aria-live="polite">
        <Callout.Text>{notification.message}</Callout.Text>
      </Callout.Root>
    </Box>
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <InterventionPanelHeader
        intervention={intervention}
        statusKey={mapDtoStatusToConfigKey(intervention.status)}
        priorityKey={mapPriorityToConfigKey(intervention.priority)}
        canEditProperties={!isLocked && can(PERM.interventions.update)}
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
        onRequestPointage={can(PERM.interventions.requestPointage) ? () => setPointageDialogOpen(true) : undefined}
        onOpenRequest={() => handleTabChange('demande')}
        onCopyCode={(ok) => notify(ok ? 'Code copié' : 'Copie impossible', ok ? 'success' : 'error')}
        canDelete={can(PERM.interventions.remove)}
        isDeletable={isDeletable}
        onDelete={handleDelete}
      />
      {notificationToast && <Box px="4" style={{ flexShrink: 0 }}>{notificationToast}</Box>}

      {tabsContent}
      {pointageDialog}
    </div>
  );
}

InterventionDetailPanel.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onDeleted: PropTypes.func,
  onRefreshList: PropTypes.func,
};
