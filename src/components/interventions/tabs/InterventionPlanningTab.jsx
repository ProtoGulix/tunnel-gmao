/**
 * Onglet Planning — vue semaine avec filtre technicien.
 * Utilisé depuis InterventionsListPage (planning global, interventionId=null)
 * et potentiellement depuis InterventionDetailPage (interventionId fixé).
 *
 * Quand interventionId est null : ActionForm affiche les sélecteurs équipement/intervention
 * et charge les steps gamme dynamiquement si l'intervention sélectionnée a un plan_id.
 * Quand interventionId est fixé : ActionForm masque les sélecteurs (showContext=false).
 */

import { useCallback, useEffect, useState } from 'react';
import { Box, Flex } from '@radix-ui/themes';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import { useApiStatus } from '@/hooks/shared/useApiStatus';
import { fetchWeekActions, fetchActiveUsers, createActionDirect } from '@/api/planning';
import ActionForm from '@/components/interventions/ActionForm';
import ErrorState from '@/components/ui/ErrorState';
import LoadingState from '@/components/ui/LoadingState';
import { DayColumn, WeekNav } from '@/components/planning/WeekCalendar';
import { addDays, getMondayOf, getWeekDays, isWeekend, todayIso } from '@/components/planning/planningUtils';

export default function InterventionPlanningTab({ interventionId = null, onActionCreated }) {
  const today = todayIso();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();

  const weekParam = searchParams.get('week');
  const [monday, setMonday] = useState(() => weekParam ?? getMondayOf(today));

  const [users, setUsers] = useState([]);
  const [techId, setTechId] = useState(user?.id ?? null);
  const [weekActions, setWeekActions] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [metadata, setMetadata] = useState({ subcategories: [], complexityFactors: [] });

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

  // Métadonnées ActionForm — chargées à la première ouverture du formulaire
  useEffect(() => {
    if (!showForm || metadata.subcategories.length > 0) return;
    Promise.all([
      import('@/api/actionCategories').then((m) => m.fetchActionCategories?.() ?? []),
      import('@/api/complexityFactors').then((m) => m.fetchComplexityFactors?.() ?? []),
    ])
      .then(([cats, factors]) => setMetadata({ subcategories: cats, complexityFactors: factors }))
      .catch(() => {});
  }, [showForm]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSuccess = () => {
    setShowForm(false);
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

      {showForm && (
        <Box mb="4">
          <ActionForm
            key={selectedDate}
            initialState={{ date: selectedDate ?? '' }}
            metadata={metadata}
            onCancel={() => setShowForm(false)}
            onSubmit={createActionDirect}
            onSuccess={handleSuccess}
            interventionId={interventionId}
            techId={techId}
            showContext={!interventionId}
          />
        </Box>
      )}

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
              onAddAction={(date) => { setSelectedDate(date); setShowForm(true); }}
              isWeekend={isWeekend(d)}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
