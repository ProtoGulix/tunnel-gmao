import PropTypes from 'prop-types';
import { useState } from 'react';
import { Flex, Text, Badge, Button, Spinner } from '@radix-ui/themes';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePlanningWeek } from '@/hooks/usePlanningWeek';
import { DayColumn } from '@/components/planning/WeekCalendar';
import DayContextPanel from '@/components/planning/DayContextPanel';
import SpontaneousPurchaseRequestModal from '@/components/home/SpontaneousPurchaseRequestModal';
import { getWeekDays, todayIso, formatWeekLabel } from '@/components/planning/planningUtils';

const PILL_COLORS = ['blue', 'green', 'orange', 'crimson', 'purple', 'pink', 'teal'];

/**
 * @param {Function} [props.onAddAction] - Called with { date, actionsByDay } to open action modal
 * @param {Function} [props.onDataRefreshed] - Called after action created (to refresh tasks)
 */
export function PlanningPane({ onAddAction, onDataRefreshed }) {
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
  } = usePlanningWeek();

  const [selectedDate, setSelectedDate] = useState(null);
  const [purchaseModalAction, setPurchaseModalAction] = useState(null);
  const today = todayIso();
  const weekDays = getWeekDays(weekStart).slice(0, 5);

  const selectedUser = users.find((u) => u.id === selectedTechId) ?? null;
  const techInitials = selectedUser
    ? `${selectedUser.first_name?.[0] ?? ''}${selectedUser.last_name?.[0] ?? ''}`.toUpperCase()
    : '';

  function handleAddActionForDay(dateStr) {
    if (onAddAction) {
      onAddAction({
        date: dateStr,
        techId: selectedTechId,
        techInitials,
        weekActionsForDay: actionsByDay[dateStr] ?? [],
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

  return (
    <Flex direction="column" gap="4" p="4">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
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
};
