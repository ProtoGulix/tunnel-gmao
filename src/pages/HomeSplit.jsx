import { useState, useCallback } from 'react';
import { ClipboardList, Home, ShoppingCart } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { PlanningPane } from '@/components/home/PlanningPane';
import { TasksPane } from '@/components/home/TasksPane';
import ActionModal from '@/components/home/ActionModal';
import SpontaneousPurchaseRequestModal from '@/components/home/SpontaneousPurchaseRequestModal';
import SpontaneousInterventionRequestModal from '@/components/home/SpontaneousInterventionRequestModal';
import { usePlanningWeek } from '@/hooks/usePlanningWeek';

export default function HomeSplit() {
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [interventionModalOpen, setInterventionModalOpen] = useState(false);
  const [actionModal, setActionModal] = useState({ open: false, date: null, techId: null, techInitials: '', weekActionsForDay: [], preselectedAction: null });

  const planningHook = usePlanningWeek();
  const { taskGroups, taskPagination, taskSkip, setTaskSkip, selectedTechId, retry: refreshTasks } = planningHook;

  const dateLabel = (() => {
    const raw = new Date().toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  })();

  const purchaseAction = {
    label: "Demande d'achat",
    icon: ShoppingCart,
    onClick: () => setPurchaseModalOpen(true),
  };

  const interventionAction = {
    label: "Demande d'inter",
    icon: ClipboardList,
    onClick: () => setInterventionModalOpen(true),
  };

  const handleOpenActionModal = useCallback(({ date, techId, techInitials, weekActionsForDay, preselectedAction }) => {
    setActionModal({ open: true, date, techId, techInitials, weekActionsForDay: weekActionsForDay ?? [], preselectedAction: preselectedAction ?? null });
  }, []);

  const handleTaskAddAction = useCallback(({ date, group, task }) => {
    const preselectedAction = group
      ? {
          intervention: {
            id: group.id,
            code: group.code ?? '',
            title: group.title ?? '',
            status_actual: group.status ?? null,
            plan_id: null,
            machine: group.equipement
              ? { id: group.equipement.id, code: group.equipement.code ?? '', name: group.equipement.name ?? '' }
              : null,
          },
        }
      : null;
    setActionModal({
      open: true,
      date,
      techId: selectedTechId,
      techInitials: '',
      weekActionsForDay: [],
      preselectedAction,
    });
  }, [selectedTechId]);

  const handleActionCreated = useCallback(() => {
    setActionModal((m) => ({ ...m, open: false }));
    refreshTasks();
  }, [refreshTasks]);

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <PageHeader
        noMargin
        title="Accueil"
        subtitle={dateLabel}
        icon={Home}
        actions={[interventionAction, purchaseAction]}
      />

      {/* ── Corps principal ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>

        {/* ── Colonne gauche — Tâches ─────────────────────────────────────── */}
        <div style={{ width: '38%', borderRight: '1px solid var(--gray-5)' }}>
          <TasksPane
            taskGroups={taskGroups}
            pagination={taskPagination}
            skip={taskSkip}
            onPageChange={setTaskSkip}
            onAddAction={handleTaskAddAction}
            users={planningHook.users}
            onTaskUpdate={refreshTasks}
          />
        </div>

        {/* ── Colonne droite — Planning ────────────────────────────────────── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <PlanningPane
            onAddAction={handleOpenActionModal}
            onDataRefreshed={refreshTasks}
            planningHook={planningHook}
          />
        </div>
      </div>

      {/* ── Modal saisie action ─────────────────────────────────────────────── */}
      <ActionModal
        open={actionModal.open}
        onOpenChange={(open) => setActionModal((m) => ({ ...m, open }))}
        date={actionModal.date}
        techId={actionModal.techId}
        techInitials={actionModal.techInitials}
        weekActionsForDay={actionModal.weekActionsForDay}
        preselectedAction={actionModal.preselectedAction}
        onActionCreated={handleActionCreated}
      />

      <SpontaneousPurchaseRequestModal
        open={purchaseModalOpen}
        onOpenChange={setPurchaseModalOpen}
      />

      <SpontaneousInterventionRequestModal
        open={interventionModalOpen}
        onOpenChange={setInterventionModalOpen}
      />
    </div>
  );
}
