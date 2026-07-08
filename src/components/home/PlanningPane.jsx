import PropTypes from 'prop-types';
import { useState } from 'react';
import { Flex, Text, Badge, Button, Spinner } from '@radix-ui/themes';
import { ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import { usePlanningWeek } from '@/hooks/usePlanningWeek';
import { DayColumn } from '@/components/planning/WeekCalendar';
import DayContextPanel from '@/components/planning/DayContextPanel';
import SpontaneousPurchaseRequestModal from '@/components/home/SpontaneousPurchaseRequestModal';
import { getWeekDays, todayIso, formatWeekLabel } from '@/components/planning/planningUtils';
import { fetchPlanningSemainePdf } from '@/api/planning';
import { deleteAction } from '@/api/actions';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

function toIsoWeek(mondayStr) {
  // Calcul semaine ISO 8601 : jeudi de la semaine détermine l'année
  const d = new Date(mondayStr);
  const thursday = new Date(d);
  thursday.setDate(d.getDate() + 3);
  const year = thursday.getFullYear();
  const jan4 = new Date(year, 0, 4);
  const weekNum = 1 + Math.round((thursday - jan4) / 604800000);
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

const PILL_COLORS = ['blue', 'green', 'orange', 'crimson', 'purple', 'pink', 'teal'];

function DeleteErrorBanner({ error }) {
  if (!error) return null;
  return <Text size="2" color="red">{error}</Text>;
}

DeleteErrorBanner.propTypes = { error: PropTypes.string };

/**
 * @param {Function} [props.onAddAction] - Called with { date, actionsByDay } to open action modal
 * @param {Function} [props.onDataRefreshed] - Called after action created (to refresh tasks)
 */
export function PlanningPane({ onAddAction, onDataRefreshed, planningHook, hideControls = false }) {
  const ownHook = usePlanningWeek();
  const {
    actionsByDay,
    users,
    weekStart,
    selectedTechId,
    setSelectedTechId,
    prevWeek,
    nextWeek,
    goToday,
    loading,
    retry,
  } = planningHook ?? ownHook;

  const [selectedDate, setSelectedDate] = useState(null);
  const [purchaseModalAction, setPurchaseModalAction] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const today = todayIso();
  const weekDays = getWeekDays(weekStart).slice(0, 5);

  const selectedUser = users.find((u) => u.id === selectedTechId) ?? null;
  const techInitials = selectedUser
    ? `${selectedUser.first_name?.[0] ?? ''}${selectedUser.last_name?.[0] ?? ''}`.toUpperCase()
    : '';

  function handleAddActionForDay(dateStr, preselectedAction = null) {
    if (onAddAction) {
      onAddAction({
        date: dateStr,
        techId: selectedTechId,
        techInitials,
        weekActionsForDay: actionsByDay[dateStr] ?? [],
        preselectedAction,
      });
    } else {
      setSelectedDate(dateStr);
    }
  }

  function handleActionCreated() {
    setSelectedDate(null);
    retry();
    onDataRefreshed?.();
  }

  async function handleDeleteAction(action) {
    setDeleteError(null);
    try {
      await deleteAction(action.id);
      retry();
      onDataRefreshed?.();
    } catch (err) {
      setDeleteError(extractApiErrorMessage(err, "Erreur lors de la suppression de l'action"));
      throw err;
    }
  }

  return (
    <Flex direction="column" gap="4" p="4">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      {!hideControls && (
        <Flex direction="column" gap="2">
          <Flex justify="between" align="center">
            <Text size="4" weight="bold">Planning</Text>
            {loading && <Spinner size="1" />}
          </Flex>

          {/* Navigation semaine */}
          <Flex align="center" gap="2">
            <Button size="2" variant="soft" color="gray" onClick={prevWeek}>
              <ChevronLeft size={16} />
            </Button>
            <Text size="3" weight="medium" style={{ flex: 1, textAlign: 'center' }}>
              {formatWeekLabel(weekStart)}
            </Text>
            <Button size="2" variant="soft" color="gray" onClick={nextWeek}>
              <ChevronRight size={16} />
            </Button>
            <Button size="2" variant="ghost" color="blue" onClick={goToday}>
              Auj.
            </Button>
            {selectedTechId && (
              <Button
                size="2"
                variant="soft"
                color="gray"
                title="Télécharger la fiche semaine PDF"
                onClick={() => fetchPlanningSemainePdf(selectedTechId, toIsoWeek(weekStart))}
              >
                <FileDown size={15} />
              </Button>
            )}
          </Flex>

          {/* Sélecteur tech — pills */}
          <Flex gap="1" wrap="wrap">
            {users.map((u, i) => {
              const initials = `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`.toUpperCase();
              const color = PILL_COLORS[i % PILL_COLORS.length];
              const isSelected = u.id === selectedTechId;
              return (
                <Badge
                  key={u.id}
                  color={isSelected ? color : 'gray'}
                  variant={isSelected ? 'solid' : 'soft'}
                  radius="full"
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                  onClick={() => setSelectedTechId(u.id)}
                  title={`${u.first_name ?? ''} ${u.last_name ?? ''}`}
                >
                  {initials}
                </Badge>
              );
            })}
          </Flex>
        </Flex>
      )}

      <DeleteErrorBanner error={deleteError} />

      {/* ── Jours ──────────────────────────────────────────────────────────── */}
      <Flex direction="column" gap="3">
        {weekDays.map((dateStr) => (
          <DayColumn
            key={dateStr}
            dateStr={dateStr}
            actions={actionsByDay[dateStr] ?? []}
            isToday={dateStr === today}
            onAddAction={handleAddActionForDay}
            onAddPurchaseRequest={(action) => setPurchaseModalAction(action)}
            onDeleteAction={handleDeleteAction}
            isWeekend={false}
            inlineActions
          />
        ))}
      </Flex>

      <SpontaneousPurchaseRequestModal
        open={!!purchaseModalAction}
        onOpenChange={(v) => { if (!v) setPurchaseModalAction(null); }}
        action={purchaseModalAction}
        onSuccess={retry}
      />

      {/* Panneau saisie action inline (quand pas de modal externe) */}
      {selectedDate && !onAddAction && (
        <DayContextPanel
          date={selectedDate}
          techId={selectedTechId}
          techInitials={techInitials}
          weekActionsForDay={actionsByDay[selectedDate] ?? []}
          onClose={() => setSelectedDate(null)}
          onActionCreated={handleActionCreated}
        />
      )}
    </Flex>
  );
}

PlanningPane.propTypes = {
  onAddAction: PropTypes.func,
  onDataRefreshed: PropTypes.func,
  planningHook: PropTypes.object,
  hideControls: PropTypes.bool,
};
