/**
 * Onglet Planning d'une intervention.
 * Vue semaine avec filtre technicien — affiche les actions de l'intervention
 * sur la semaine sélectionnée.
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

  // Semaine depuis query param ?week=YYYY-MM-DD (lundi)
  const weekParam = searchParams.get('week');
  const [monday, setMonday] = useState(() => weekParam ?? getMondayOf(today));

  const [users, setUsers] = useState([]);
  const [techId, setTechId] = useState(null);
  const [weekActions, setWeekActions] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [metadata, setMetadata] = useState({ subcategories: [], complexityFactors: [] });

  const { status, error, wrap } = useApiStatus();
  const { wrap: wrapUsers } = useApiStatus();

  const weekDays = getWeekDays(monday);

  // Sync monday → query param
  const setMondayAndParam = useCallback((m) => {
    setMonday(m);
    setSearchParams((prev) => { prev.set('week', m); return prev; }, { replace: true });
  }, [setSearchParams]);

  // Charger users et pré-sélectionner l'utilisateur connecté s'il est technicien
  useEffect(() => {
    wrapUsers(async () => {
      const allUsers = await fetchActiveUsers();
      setUsers(allUsers);
      setTechId((current) => {
        if (current !== null) return current; // déjà sélectionné manuellement
        const match = allUsers.find((u) => u.id === user?.id);
        return match ? match.id : null;
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Charger les actions de la semaine
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

  // Métadonnées ActionForm
  useEffect(() => {
    Promise.all([
      import('@/api/actionCategories').then((m) => m.fetchActionCategories?.() ?? []),
      import('@/api/complexityFactors').then((m) => m.fetchComplexityFactors?.() ?? []),
    ])
      .then(([cats, factors]) => setMetadata({ subcategories: cats, complexityFactors: factors }))
      .catch(() => {});
  }, []);

  const handleSuccess = () => {
    setShowForm(false);
    loadWeek();
    onActionCreated?.();
  };

  return (
    <Box pt="4">
      {/* Barre de navigation semaine */}
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

      {/* Formulaire */}
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
          />
        </Box>
      )}

      {/* États API */}
      {status === 'loading' && <LoadingState fullscreen={false} message="Chargement…" />}
      {status === 'error' && <ErrorState error={error} onRetry={loadWeek} />}

      {/* Grille semaine : 5 × 1fr (Lun–Ven) + 80px (Sam) + 80px (Dim) */}
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
