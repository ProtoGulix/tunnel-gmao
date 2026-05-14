import { useState, useEffect, useCallback } from 'react';
import { fetchTasksWorkspace } from '@/api/tasks';
import { fetchInterventions } from '@/api/interventions';
import { fetchDashboardSummary } from '@/api/dashboard';
import { useAuth } from '@/auth/useAuth';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

const PRIORITY_ORDER = { urgent: 0, important: 1, normal: 2, normale: 2, faible: 3 };

export function useHomeData() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [interventionsLoading, setInterventionsLoading] = useState(true);
  const [tasksError, setTasksError] = useState(null);
  const [interventionsError, setInterventionsError] = useState(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    setTasksLoading(true);
    setInterventionsLoading(true);
    setTasksError(null);
    setInterventionsError(null);

    const [tasksResult, interventionsResult, summaryResult] = await Promise.allSettled([
      fetchTasksWorkspace({ assigned_to: user.id, status: 'todo,in_progress', limit: 10 }),
      fetchInterventions({ status: 'ouvert', include: 'stats', limit: 50, sort: '-priority' }),
      fetchDashboardSummary(),
    ]);

    if (tasksResult.status === 'fulfilled') {
      setTasks((tasksResult.value.items ?? []).flatMap((g) => g.tasks ?? []));
    } else {
      setTasksError(
        extractApiErrorMessage(tasksResult.reason, 'Erreur lors du chargement des tâches')
      );
    }
    setTasksLoading(false);

    if (interventionsResult.status === 'fulfilled') {
      const all = interventionsResult.value;
      // TODO: utiliser un filtre server-side assigned_to quand /interventions supportera assigned_to
      const userInitials = (user.initials || user.initial || '').toUpperCase();
      const filtered = userInitials
        ? all.filter((i) => (i.techInitials || '').toUpperCase() === userInitials)
        : all;
      const base = filtered.length > 0 ? filtered : all;
      const sorted = [...base].sort(
        (a, b) =>
          (PRIORITY_ORDER[a.priority?.toLowerCase()] ?? 99) -
          (PRIORITY_ORDER[b.priority?.toLowerCase()] ?? 99)
      );
      setInterventions(sorted.slice(0, 8));
    } else {
      setInterventionsError(
        extractApiErrorMessage(
          interventionsResult.reason,
          'Erreur lors du chargement des interventions'
        )
      );
    }
    setInterventionsLoading(false);

    if (summaryResult.status === 'fulfilled') {
      setSummary(summaryResult.value);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return {
    tasks,
    interventions,
    summary,
    tasksLoading,
    interventionsLoading,
    tasksError,
    interventionsError,
    refresh: fetchData,
  };
}
