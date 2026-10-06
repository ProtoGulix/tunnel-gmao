/**
 * Onglet Planning — vue semaine avec filtre technicien.
 * Utilisé depuis InterventionsListPage (planning global).
 *
 * Le clic sur un jour (ou "+ Ajouter") ouvre DayContextPanel sous la grille :
 * le tech sélectionne une intervention ou une DI à gauche, saisit son action à droite.
 */

import { useCallback, useEffect, useState } from 'react';
import { Box, Flex } from '@radix-ui/themes';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { useApiStatus } from '@/hooks/shared/useApiStatus';
import { fetchWeekActions, fetchActiveUsers } from '@/api/planning';
import ErrorState from '@/components/ui/ErrorState';
import LoadingState from '@/components/ui/LoadingState';
import { DayColumn, WeekNav } from '@/components/planning/WeekCalendar';
import { addDays, getMondayOf, getWeekDays, isWeekend, todayIso } from '@/components/planning/planningUtils';
import DayContextPanel from '@/components/planning/DayContextPanel';

export default function InterventionPlanningTab({ onActionCreated }) {
  const today = todayIso();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const weekParam = searchParams.get('week');
  const [monday, setMonday] = useState(() => weekParam ?? getMondayOf(today));

  const [users, setUsers] = useState([]);
  const [techId, setTechId] = useState(user?.id ?? null);
  const [weekActions, setWeekActions] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);

  // Initiales du technicien sélectionné — transmises à InterventionCreatorFlow
  const selectedUser = users.find((u) => u.id === techId) ?? null;
  const techInitials = selectedUser
    ? `${selectedUser.first_name?.[0] ?? ''}${selectedUser.last_name?.[0] ?? ''}`.toUpperCase()
    : (user?.initials ?? '');

  const { status, error, wrap } = useApiStatus();
  const { wrap: wrapUsers } = useApiStatus();

  const weekDays = getWeekDays(monday);

  const setMondayAndParam = useCallback((m) => {
    setMonday(m);
    setSearchParams((prev) => { prev.set('week', m); return prev; }, { replace: true });
  }, [setSearchParams]);

  useEffect(() => {
    wrapUsers(async () => {
      const allUsers = await fetchActiveUsers();
      setUsers(allUsers);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadWeek = useCallback(() => {
    const sunday = addDays(monday, 6);
    wrap(async () => {
      const byDay = await fetchWeekActions(monday, sunday, techId);
      const days = getWeekDays(monday);
      days.forEach((d) => { if (!byDay[d]) byDay[d] = []; });
      setWeekActions(byDay);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monday, techId]);

  useEffect(() => { loadWeek(); }, [loadWeek]);

  const handleSuccess = () => {
    setSelectedDate(null);
    loadWeek();
    onActionCreated?.();
  };

  return (
    <Box pt="4">
      <Flex align="center" justify="between" mb="4" wrap="wrap" gap="3">
        <WeekNav
          monday={monday}
          onPrev={() => setMondayAndParam(addDays(monday, -7))}
          onNext={() => setMondayAndParam(addDays(monday, 7))}
          onToday={() => setMondayAndParam(getMondayOf(today))}
          techId={techId}
          users={users}
          onTechChange={setTechId}
        />
      </Flex>

      {status === 'loading' && <LoadingState fullscreen={false} message="Chargement…" />}
      {status === 'error' && <ErrorState error={error} onRetry={loadWeek} />}

      {status !== 'loading' && (
        <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr) 80px 80px', gap: 8, overflowX: 'auto' }}>
          {weekDays.map((d) => (
            <DayColumn
              key={d}
              dateStr={d}
              actions={weekActions[d] ?? []}
              isToday={d === today}
              onAddAction={(date) => setSelectedDate(date)}
              isWeekend={isWeekend(d)}
            />
          ))}
        </Box>
      )}

      {selectedDate && (
        <DayContextPanel
          date={selectedDate}
          techId={techId}
          techInitials={techInitials}
          weekActionsForDay={weekActions[selectedDate] ?? []}
          onClose={() => setSelectedDate(null)}
          onActionCreated={handleSuccess}
        />
      )}
    </Box>
  );
}
