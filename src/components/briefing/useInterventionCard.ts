import { useState, useCallback, type Dispatch, type SetStateAction } from 'react';
import { updateInterventionStatus } from '@/api/interventions';
import { patchInterventionTask } from '@/api/interventionTasks';
import { STATUS_CONFIG, TYPE_INTER_LABELS } from '@/config/interventionTypes';
import { getInterventionUrgency } from '@/hooks/useInterventionUrgency';
import type { BriefingSituation, InterventionDetail, InterventionTask } from '@/types/briefing';

const PRIORITY_CFG: Record<string, { color: string; label: string }> = {
  urgent:    { color: 'red',    label: 'Urgent' },
  important: { color: 'orange', label: 'Important' },
  normale:   { color: 'gray',   label: 'Normale' },
  normal:    { color: 'gray',   label: 'Normale' },
  faible:    { color: 'gray',   label: 'Faible' },
};

const STATUS_CFG_MAP = STATUS_CONFIG as Record<string, { color: string; label: string } | undefined>;

function fmtDate(d: string | null | undefined) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function completionFromProgress(tp: { total: number; done: number } | null | undefined) {
  if (!tp || tp.total === 0) return 0;
  return Math.round((tp.done / tp.total) * 100);
}

export function useCardDisplay(situation: BriefingSituation | null, detail: InterventionDetail | null) {
  const status  = situation?.status ?? '';
  const current = detail?.status ?? status;
  return {
    currentStatus: current,
    statusCfg:     STATUS_CFG_MAP[current] ?? STATUS_CFG_MAP[status],
    priorityCfg:   PRIORITY_CFG[situation?.priority ?? ''] ?? PRIORITY_CFG.normale,
    typeLabel:     TYPE_INTER_LABELS[situation?.type ?? ''] ?? situation?.type ?? '—',
    totalTime:     detail?.stats?.totalTime ?? situation?.stats?.totalTime ?? 0,
    actionCount:   detail?.stats?.actionCount ?? detail?.action?.length ?? situation?.stats?.actionCount ?? 0,
    purchaseCount: detail?.stats?.purchasePending ?? situation?.stats?.purchasePending ?? situation?.stats?.purchaseCount ?? 0,
    urgency:       getInterventionUrgency(situation?.next_due_date ?? null, situation?.reportedDate ?? null),
    completionPct: completionFromProgress(detail?.taskProgress ?? situation?.stats?.taskProgress),
    openFmt:       fmtDate(situation?.reportedDate),
    closeFmt:      fmtDate(detail?.closedAt ?? detail?.closed_at ?? null),
  };
}

// Mutation de tâche en attente de reason_code
type TaskMutation = (reasonCode: string, reasonText: string) => Promise<void>;

export function useCardActions(
  situation: BriefingSituation | null,
  tasks: InterventionTask[],
  setTasks: Dispatch<SetStateAction<InterventionTask[]>>,
  loadDetail: (id: string) => void,
  onRefresh?: () => void,
) {
  // --- Changement de statut intervention ---
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [statusSaving, setStatusSaving]   = useState(false);

  const handleStatusConfirm = useCallback(async (reasonCode: string, reasonText: string) => {
    if (!pendingStatus || !situation?.id) return;
    setStatusSaving(true);
    try {
      const text = reasonCode === 'OTHER' ? reasonText : undefined;
      await updateInterventionStatus(situation.id, pendingStatus, reasonCode, text);
      setPendingStatus(null);
      loadDetail(situation.id);
      onRefresh?.();
    } finally {
      setStatusSaving(false);
    }
  }, [pendingStatus, situation?.id, loadDetail, onRefresh]);

  // --- Mutations de tâches (exigent reason_code utilisateur) ---
  const [pendingTaskMutation, setPendingTaskMutation] = useState<TaskMutation | null>(null);
  const [taskMutationLabel, setTaskMutationLabel]     = useState<string>('');
  const [taskMutationSaving, setTaskMutationSaving]   = useState(false);

  const requestTaskMutation = useCallback((label: string, mutation: TaskMutation) => {
    setTaskMutationLabel(label);
    setPendingTaskMutation(() => mutation);
  }, []);

  const confirmTaskMutation = useCallback(async (reasonCode: string, reasonText: string) => {
    if (!pendingTaskMutation) return;
    setTaskMutationSaving(true);
    try {
      await pendingTaskMutation(reasonCode, reasonText);
      setPendingTaskMutation(null);
    } finally {
      setTaskMutationSaving(false);
    }
  }, [pendingTaskMutation]);

  const cancelTaskMutation = useCallback(() => setPendingTaskMutation(null), []);

  // --- saveField : édition inline d'un champ de tâche ---
  const saveField = useCallback((taskId: string, field: string, value: string | null, onDone: () => void) => {
    requestTaskMutation(`Modifier ${field}`, async (reasonCode, reasonText) => {
      const text = reasonCode === 'OTHER' ? reasonText : undefined;
      await patchInterventionTask(taskId, { [field]: value ?? null, reason_code: reasonCode, ...(text ? { reason_text: text } : {}) });
      onDone();
    });
  }, [requestTaskMutation]);

  // --- handleMove : réordonnancement ---
  const handleMove = useCallback((task: InterventionTask, idx: number, direction: number) => {
    if (!situation?.id) return;
    const sorted  = [...tasks].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const swap      = sorted[swapIdx];
    const newOrder  = swap.sort_order ?? swapIdx;
    const taskOrder = task.sort_order ?? idx;
    requestTaskMutation('Réordonner les tâches', async (reasonCode, reasonText) => {
      const text    = reasonCode === 'OTHER' ? reasonText : undefined;
      const payload = { reason_code: reasonCode, ...(text ? { reason_text: text } : {}) };
      setTasks((prev) => prev.map((t) => {
        if (t.id === task.id) return { ...t, sort_order: newOrder };
        if (t.id === swap.id) return { ...t, sort_order: taskOrder };
        return t;
      }));
      await Promise.all([
        patchInterventionTask(task.id, { sort_order: newOrder, ...payload }),
        patchInterventionTask(swap.id, { sort_order: taskOrder, ...payload }),
      ]).catch(() => loadDetail(situation!.id));
    });
  }, [tasks, setTasks, situation?.id, loadDetail, requestTaskMutation]);

  const closePending = useCallback(() => setPendingStatus(null), []);

  return {
    // statut intervention
    pendingStatus, setPendingStatus, closePending, statusSaving, handleStatusConfirm,
    // mutations tâches
    pendingTaskMutation: pendingTaskMutation !== null,
    taskMutationLabel, taskMutationSaving,
    confirmTaskMutation, cancelTaskMutation,
    saveField, handleMove,
  };
}
