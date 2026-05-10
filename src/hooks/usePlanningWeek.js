import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/auth/useAuth';
import { fetchWeekActions, fetchActiveUsers } from '@/api/planning';
import { fetchTasksWorkspace } from '@/api/tasks';
import { getMondayOf, addDays, todayIso } from '@/components/planning/planningUtils';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

export function usePlanningWeek() {
  const { user } = useAuth();
  const today = todayIso();

  const [weekStart, setWeekStart] = useState(() => getMondayOf(today));
  const [selectedTechId, setSelectedTechId] = useState(null);
  const [actionsByDay, setActionsByDay] = useState({});
  const [taskGroups, setTaskGroups] = useState([]);
  const [taskPagination, setTaskPagination] = useState(null);
  const [taskSkip, setTaskSkip] = useState(0);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pre-select connected user when available
  useEffect(() => {
    if (user?.id && selectedTechId === null) {
      setSelectedTechId(user.id);
    }
  }, [user?.id, selectedTechId]);

  // Load active users once on mount
  useEffect(() => {
    fetchActiveUsers()
      .then(setUsers)
      .catch(() => {});
  }, []);

  const fetchData = useCallback(async () => {
    if (!selectedTechId) return;
    const weekEnd = addDays(weekStart, 6);

    setLoading(true);
    setError(null);

    const [actionsResult, tasksResult] = await Promise.allSettled([
      fetchWeekActions(weekStart, weekEnd, selectedTechId),
      fetchTasksWorkspace({
        status: 'todo,in_progress',
        assignee_id: selectedTechId,
        skip: taskSkip,
        limit: 20,
      }),
    ]);

    if (actionsResult.status === 'fulfilled') {
      setActionsByDay(actionsResult.value ?? {});
    } else {
      setActionsByDay({});
    }

    if (tasksResult.status === 'fulfilled') {
      setTaskGroups(tasksResult.value.items ?? []);
      setTaskPagination(tasksResult.value.pagination ?? null);
    } else {
      setTaskGroups([]);
      setTaskPagination(null);
    }

    if (actionsResult.status === 'rejected' && tasksResult.status === 'rejected') {
      setError(
        extractApiErrorMessage(actionsResult.reason, 'Erreur lors du chargement du planning')
      );
    }

    setLoading(false);
  }, [weekStart, selectedTechId, taskSkip]);

  useEffect(() => {
    if (selectedTechId) {
      fetchData();
    }
  }, [fetchData, selectedTechId]);

  return {
    actionsByDay,
    taskGroups,
    taskPagination,
    taskSkip,
    setTaskSkip,
    users,
    weekStart,
    weekEnd: addDays(weekStart, 6),
    selectedTechId,
    setSelectedTechId,
    prevWeek: () => setWeekStart((w) => addDays(w, -7)),
    nextWeek: () => setWeekStart((w) => addDays(w, 7)),
    goToday: () => setWeekStart(getMondayOf(today)),
    loading,
    error,
    retry: fetchData,
  };
}
