import { useState, useCallback } from 'react';
import { Tabs, Box } from '@radix-ui/themes';
import { Home, ShoppingCart } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { PlanningPane } from '@/components/home/PlanningPane';
import { TasksPane } from '@/components/home/TasksPane';
import { BriefingPane } from '@/components/home/BriefingPane';
import ActionModal from '@/components/home/ActionModal';
import SpontaneousPurchaseRequestModal from '@/components/home/SpontaneousPurchaseRequestModal';
import { usePlanningWeek } from '@/hooks/usePlanningWeek';

export default function HomeSplit() {
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [actionModal, setActionModal] = useState({ open: false, date: null, techId: null, techInitials: '', weekActionsForDay: [] });

  const { tasks, selectedTechId, retry: refreshTasks } = usePlanningWeek();

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

  const handleOpenActionModal = useCallback(({ date, techId, techInitials, weekActionsForDay }) => {
    setActionModal({ open: true, date, techId, techInitials, weekActionsForDay: weekActionsForDay ?? [] });
  }, []);

  const handleTaskAddAction = useCallback(({ date, task }) => {
    setActionModal({
      open: true,
      date,
      techId: selectedTechId,
      techInitials: '',
      weekActionsForDay: [],
    });
  }, [selectedTechId]);

  const handleActionCreated = useCallback(() => {
    setActionModal((m) => ({ ...m, open: false }));
    refreshTasks();
  }, [refreshTasks]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <PageHeader
        noMargin
        title="Accueil"
        subtitle={dateLabel}
        icon={Home}
        actions={[purchaseAction]}
      />

      {/* ── Corps principal ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* ── Colonne gauche — Tâches + onglet Briefing ───────────────────── */}
        <div
          style={{
            width: '38%',
            borderRight: '1px solid var(--gray-5)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Tabs.Root defaultValue="tasks" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <Tabs.List style={{ flexShrink: 0, paddingLeft: 12, paddingRight: 12 }}>
              <Tabs.Trigger value="tasks">Mes tâches</Tabs.Trigger>
              <Tabs.Trigger value="briefing">Briefing</Tabs.Trigger>
            </Tabs.List>

            <Box style={{ flex: 1, overflow: 'hidden' }}>
              <Tabs.Content value="tasks" style={{ height: '100%' }}>
                <TasksPane tasks={tasks} onAddAction={handleTaskAddAction} />
              </Tabs.Content>

              <Tabs.Content value="briefing" style={{ height: '100%' }}>
                <BriefingPane />
              </Tabs.Content>
            </Box>
          </Tabs.Root>
        </div>

        {/* ── Colonne droite — Planning ────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <PlanningPane
            onAddAction={handleOpenActionModal}
            onDataRefreshed={refreshTasks}
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
        onActionCreated={handleActionCreated}
      />

      <SpontaneousPurchaseRequestModal
        open={purchaseModalOpen}
        onOpenChange={setPurchaseModalOpen}
      />
    </div>
  );
}
