import { useState } from 'react';
import { Flex, Text, Badge, Button, Spinner } from '@radix-ui/themes';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePlanningWeek } from '@/hooks/usePlanningWeek';
import { DayColumn } from '@/components/planning/WeekCalendar';
import DayContextPanel from '@/components/planning/DayContextPanel';
import { getWeekDays, todayIso, formatWeekLabel } from '@/components/planning/planningUtils';
import { TasksPane } from './TasksPane';

// ── Palette couleurs pour pills tech ─────────────────────────────────────────
const PILL_COLORS = ['blue', 'green', 'orange', 'crimson', 'purple', 'pink', 'teal'];

export function PlanningPane() {
  const {
    actionsByDay,
    tasks,
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
  const today = todayIso();
  // Lun–Ven uniquement
  const weekDays = getWeekDays(weekStart).slice(0, 5);

  const selectedUser = users.find((u) => u.id === selectedTechId) ?? null;
  const techInitials = selectedUser
    ? `${selectedUser.first_name?.[0] ?? ''}${selectedUser.last_name?.[0] ?? ''}`.toUpperCase()
    : '';

  function handleActionCreated() {
    setSelectedDate(null);
    retry();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          padding: '12px 14px 10px',
          borderBottom: '1px solid var(--gray-4)',
          flexShrink: 0,
        }}
      >
        {/* Titre + spinner */}
        <Flex justify="between" align="center" style={{ marginBottom: 8 }}>
          <Text size="3" weight="medium">
            Planning
          </Text>
          {loading && <Spinner size="1" />}
        </Flex>

        {/* Navigation semaine */}
        <Flex align="center" gap="1" style={{ marginBottom: 8 }}>
          <Button size="1" variant="soft" color="gray" onClick={prevWeek}>
            <ChevronLeft size={14} />
          </Button>
          <Text
            size="2"
            weight="medium"
            style={{ flex: 1, textAlign: 'center', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
          >
            {formatWeekLabel(weekStart)}
          </Text>
          <Button size="1" variant="soft" color="gray" onClick={nextWeek}>
            <ChevronRight size={14} />
          </Button>
          <Button size="1" variant="ghost" color="blue" onClick={goToday} style={{ flexShrink: 0 }}>
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
      </div>

      {/* ── Jours (scrollable) ──────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 14px' }}>
        {weekDays.map((dateStr) => (
          <div key={dateStr} style={{ marginBottom: 12 }}>
            <DayColumn
              dateStr={dateStr}
              actions={actionsByDay[dateStr] ?? []}
              isToday={dateStr === today}
              onAddAction={setSelectedDate}
              isWeekend={false}
              inlineActions
            />
          </div>
        ))}

        {/* Panneau saisie action */}
        {selectedDate && (
          <DayContextPanel
            date={selectedDate}
            techId={selectedTechId}
            techInitials={techInitials}
            weekActionsForDay={actionsByDay[selectedDate] ?? []}
            onClose={() => setSelectedDate(null)}
            onActionCreated={handleActionCreated}
          />
        )}
      </div>

      {/* ── Tâches (fixe en bas) ───────────────────────────────────────────── */}
      <TasksPane tasks={tasks} />
    </div>
  );
}
