import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchInterventions } from '@/api/interventions';
import { fetchActiveUsers } from '@/api/planning';
import {
  createInterventionTask,
  fetchInterventionTasksList,
  updateInterventionTask,
} from '@/api/interventionTasks';
import { setTasksSidebarBadgeCount } from '@/hooks/tasks/tasksBadge';

const GROUPING_KEY = 'tunnel_tasks_grouping';

const STATUS_LABEL = {
  todo: 'En attente',
  in_progress: 'En cours',
  done: 'Validee',
  skipped: 'Ignoree',
};

const ORIGIN_LABEL = {
  plan: 'Gamme',
  resp: 'Resp',
  tech: 'Tech',
};

function deriveInitials(assignedTo) {
  if (!assignedTo) return '';
  if (assignedTo.initial) return String(assignedTo.initial).toUpperCase();
  if (assignedTo.initials) return String(assignedTo.initials).toUpperCase();

  const first = String(assignedTo.first_name || assignedTo.firstName || '').trim();
  const last = String(assignedTo.last_name || assignedTo.lastName || '').trim();
  return `${first[0] || ''}${last[0] || ''}`.toUpperCase();
}

function mapTask(raw) {
  const assignedTo = raw.assigned_to || raw.assignedTo || null;
  const intervention = raw.intervention || null;
  const equipement = raw.equipement || raw.machine || intervention?.equipement || null;

  const originCode = raw.origin || 'resp';
  const statusCode = raw.status || 'todo';

  return {
    id: String(raw.id ?? ''),
    origin: originCode,
    originLabel: ORIGIN_LABEL[originCode] || originCode,
    status: statusCode,
    statusLabel: STATUS_LABEL[statusCode] || statusCode,
    label: raw.label || 'Sans libelle',
    interventionId: String(raw.intervention_id || intervention?.id || ''),
    interventionCode: raw.intervention_code || intervention?.code || '—',
    interventionTitle: raw.intervention_title || intervention?.title || '',
    equipementId: String(raw.equipement_id || equipement?.id || ''),
    equipementName:
      raw.equipement_name || equipement?.name || equipement?.code || 'Machine inconnue',
    assignedTo,
    assignedInitial: deriveInitials(assignedTo),
    assignedId: String(assignedTo?.id || ''),
    timeSpent: Number(raw.time_spent ?? raw.total_time_spent ?? 0) || 0,
    dueDate: raw.due_date || null,
    optional: Boolean(raw.optional),
    createdBy: raw.created_by || null,
    createdAt: raw.created_at || null,
    skipReason: raw.skip_reason || '',
  };
}

function isUnassigned(task) {
  return !task.assignedId;
}

function includeBySearch(task, search) {
  if (!search) return true;
  const value = search.toLowerCase().trim();
  const haystack = [
    task.label,
    task.interventionCode,
    task.interventionTitle,
    task.equipementName,
    task.assignedInitial,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return haystack.includes(value);
}

function getGroup(task, grouping) {
  if (grouping === 'machine') {
    return {
      key: task.equipementId || `machine-${task.equipementName}`,
      label: task.equipementName || 'Machine inconnue',
    };
  }

  if (grouping === 'status') {
    return {
      key: task.status,
      label: task.statusLabel,
    };
  }

  if (grouping === 'technician') {
    return {
      key: task.assignedId || '__unassigned__',
      label: task.assignedId ? task.assignedInitial || 'Technicien' : 'Non assigne',
    };
  }

  return {
    key: task.interventionId || `inter-${task.interventionCode}`,
    label: task.interventionCode || 'Intervention inconnue',
  };
}

function sortTasks(a, b) {
  const statusOrder = { todo: 0, in_progress: 1, skipped: 2, done: 3 };
  const sa = statusOrder[a.status] ?? 99;
  const sb = statusOrder[b.status] ?? 99;
  if (sa !== sb) return sa - sb;
  return a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' });
}

export function useTasks() {
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [openInterventions, setOpenInterventions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [origin, setOrigin] = useState('');
  const [assignee, setAssignee] = useState('');

  const [expandedRowId, setExpandedRowId] = useState(null);
  const [mode, setMode] = useState(null);
  const [saving, setSaving] = useState(false);

  const [grouping, setGroupingState] = useState(
    () => localStorage.getItem(GROUPING_KEY) || 'intervention'
  );

  const setGrouping = useCallback((value) => {
    setGroupingState(value);
    localStorage.setItem(GROUPING_KEY, value);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [openTasksRaw, closedTasksRaw, usersRaw, interventionsRaw] = await Promise.all([
        fetchInterventionTasksList({ status: 'todo,in_progress', include_done: false }),
        fetchInterventionTasksList({ status: 'done,skipped', include_done: true }),
        fetchActiveUsers(),
        fetchInterventions({ status: 'ouvert,en_cours,attente_pieces,attente_prod', limit: 1000 }),
      ]);

      const unique = new Map();
      [...openTasksRaw, ...closedTasksRaw].forEach((raw) => {
        const key = String(raw?.id ?? '');
        if (key && !unique.has(key)) unique.set(key, raw);
      });

      const mapped = Array.from(unique.values()).map(mapTask);
      setItems(mapped);
      setUsers(Array.isArray(usersRaw) ? usersRaw : []);
      setOpenInterventions(Array.isArray(interventionsRaw) ? interventionsRaw : []);

      const badgeCount = mapped.filter(
        (task) => task.status === 'todo' && isUnassigned(task)
      ).length;
      setTasksSidebarBadgeCount(badgeCount);
    } catch (err) {
      setError(
        err?.response?.data?.detail || err?.message || 'Erreur lors du chargement des taches'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counters = useMemo(() => {
    const total = items.length;
    const backlog = items.filter((task) => task.status === 'todo' && isUnassigned(task)).length;
    const inProgress = items.filter((task) => task.status === 'in_progress').length;
    const skipped = items.filter((task) => task.status === 'skipped').length;
    return { total, backlog, inProgress, skipped };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((task) => {
      if (status && task.status !== status) return false;
      if (origin && task.origin !== origin) return false;
      if (assignee === '__unassigned__' && !isUnassigned(task)) return false;
      if (assignee && assignee !== '__unassigned__' && task.assignedId !== assignee) return false;
      return includeBySearch(task, search);
    });
  }, [items, search, status, origin, assignee]);

  const sortedItems = useMemo(() => {
    return filteredItems.slice().sort((a, b) => {
      const groupA = getGroup(a, grouping);
      const groupB = getGroup(b, grouping);
      const groupCmp = groupA.label.localeCompare(groupB.label, 'fr', { sensitivity: 'base' });
      if (groupCmp !== 0) return groupCmp;
      return sortTasks(a, b);
    });
  }, [filteredItems, grouping]);

  const assigneeOptions = useMemo(() => {
    const list = users.map((user) => ({
      value: String(user.id),
      label: user.initials
        ? `${String(user.initials).toUpperCase()} - ${user.first_name || ''} ${user.last_name || ''}`.trim()
        : `${user.first_name || ''} ${user.last_name || ''}`.trim(),
    }));

    return [{ value: '__unassigned__', label: 'Non assigne' }, ...list];
  }, [users]);

  const quickFilter = useCallback((type) => {
    if (type === 'reset') {
      setStatus('');
      setAssignee('');
      return;
    }

    if (type === 'backlog') {
      setStatus('todo');
      setAssignee('__unassigned__');
      return;
    }

    if (type === 'in_progress') {
      setStatus('in_progress');
      setAssignee('');
      return;
    }

    if (type === 'skipped') {
      setStatus('skipped');
      setAssignee('');
    }
  }, []);

  const patchTask = useCallback(
    async (taskId, updates) => {
      setSaving(true);
      try {
        await updateInterventionTask(taskId, updates);
        await load();
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  const createTask = useCallback(
    async ({ interventionId, label, assignedTo }) => {
      setSaving(true);
      try {
        await createInterventionTask({
          intervention_id: String(interventionId),
          label,
          origin: 'resp',
          ...(assignedTo ? { assigned_to: assignedTo } : {}),
        });
        await load();
        setMode(null);
      } finally {
        setSaving(false);
      }
    },
    [load]
  );

  return {
    items,
    users,
    openInterventions,
    loading,
    error,
    search,
    setSearch,
    status,
    setStatus,
    origin,
    setOrigin,
    assignee,
    setAssignee,
    sortedItems,
    grouping,
    setGrouping,
    counters,
    assigneeOptions,
    quickFilter,
    refresh: load,
    expandedRowId,
    setExpandedRowId,
    mode,
    setMode,
    saving,
    patchTask,
    createTask,
  };
}
