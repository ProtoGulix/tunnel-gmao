import { useState, useCallback } from 'react';
import { ClipboardList, Home, ShoppingCart, ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import { Flex, Text, Button } from '@radix-ui/themes';
import PageHeader from '@/components/layout/PageHeader';
import { PlanningPane } from '@/components/home/PlanningPane';
import { TasksPane } from '@/components/home/TasksPane';
import ActionModal from '@/components/home/ActionModal';
import SpontaneousPurchaseRequestModal from '@/components/home/SpontaneousPurchaseRequestModal';
import SpontaneousInterventionRequestModal from '@/components/home/SpontaneousInterventionRequestModal';
import { usePlanningWeek } from '@/hooks/usePlanningWeek';
import { formatWeekLabel } from '@/components/planning/planningUtils';
import { fetchPlanningSemainePdf } from '@/api/planning';

export default function HomeSplit() {
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [interventionModalOpen, setInterventionModalOpen] = useState(false);
  const [actionModal, setActionModal] = useState({ open: false, date: null, techId: null, techInitials: '', weekActionsForDay: [], preselectedAction: null });

  const planningHook = usePlanningWeek();
  const { taskGroups, taskPagination, taskSkip, setTaskSkip, selectedTechId, setSelectedTechId, retry: refreshTasks, weekStart, prevWeek, nextWeek, goToday, users } = planningHook;

  const AVATAR_BG = [
    'var(--blue-9)', 'var(--green-9)', 'var(--orange-9)', 'var(--crimson-9)',
    'var(--purple-9)', 'var(--pink-9)', 'var(--teal-9)',
  ];

  function toIsoWeek(mondayStr) {
    const d = new Date(mondayStr);
    const thursday = new Date(d);
    thursday.setDate(d.getDate() + 3);
    const year = thursday.getFullYear();
    const jan4 = new Date(year, 0, 4);
    const weekNum = 1 + Math.round((thursday - jan4) / 604800000);
    return `${year}-W${String(weekNum).padStart(2, '0')}`;
  }

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
            plan_id: group.plan_id ?? null,
            machine: group.equipement
              ? { id: group.equipement.id, code: group.equipement.code ?? '', name: group.equipement.name ?? '' }
              : null,
          },
          task: task ?? null,
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

  const headerControls = (
    <Flex align="center" gap="2">
      {/* Sélecteur tech — avatars */}
      <Flex gap="1" align="center">
        {users.map((u, i) => {
          const initials = `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase();
          const bg = AVATAR_BG[i % AVATAR_BG.length];
          const isSelected = u.id === selectedTechId;
          return (
            <button
              key={u.id}
              type="button"
              title={`${u.first_name ?? ''} ${u.last_name ?? ''}`}
              onClick={() => setSelectedTechId(u.id)}
              style={{
                all: 'unset',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: '50%',
                cursor: 'pointer',
                fontSize: 11,
                fontWeight: 600,
                userSelect: 'none',
                backgroundColor: isSelected ? bg : 'var(--gray-4)',
                color: isSelected ? 'white' : 'var(--gray-10)',
                opacity: isSelected ? 1 : 0.65,
                outline: isSelected ? `2px solid ${bg}` : 'none',
                outlineOffset: 2,
                transition: 'all 0.15s',
              }}
            >
              {initials}
            </button>
          );
        })}
      </Flex>

      {/* Séparateur */}
      <div style={{ width: 1, height: 20, background: 'var(--gray-5)', flexShrink: 0 }} />

      {/* Navigation semaine */}
      <Button size="2" variant="soft" color="gray" onClick={prevWeek}>
        <ChevronLeft size={16} />
      </Button>
      <Text size="2" weight="medium" style={{ whiteSpace: 'nowrap' }}>
        {formatWeekLabel(weekStart)}
      </Text>
      <Button size="2" variant="soft" color="gray" onClick={nextWeek}>
        <ChevronRight size={16} />
      </Button>
      <Button size="2" variant="soft" color="gray" onClick={goToday}>
        Auj.
      </Button>
      {selectedTechId && (
        <Button
          size="2"
          variant="solid"
          color="blue"
          title="Télécharger la fiche semaine PDF"
          onClick={() => fetchPlanningSemainePdf(selectedTechId, toIsoWeek(weekStart))}
        >
          <FileDown size={15} />
          Fiche semaine
        </Button>
      )}
    </Flex>
  );

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <PageHeader
        noMargin
        title="Accueil"
        subtitle={dateLabel}
        icon={Home}
        actions={[
          { label: headerControls },
          interventionAction,
          purchaseAction,
        ]}
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
            hideControls
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
