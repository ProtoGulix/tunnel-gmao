import { useState, useCallback, type Dispatch, type SetStateAction } from 'react';
import { updateIntervention, updateInterventionStatus } from '@/api/interventions';
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

export function useCardActions(
  situation: BriefingSituation | null,
  tasks: InterventionTask[],
  setTasks: Dispatch<SetStateAction<InterventionTask[]>>,
  loadDetail: (id: string) => void,
  onRefresh?: () => void,
) {
  const [statusSaving, setStatusSaving]     = useState(false);
  const [prioritySaving, setPrioritySaving] = useState(false);
  const [error, setError]                   = useState<string | null>(null);

  // Changement de statut — l'intercepteur axios déclenche useAuditGuard si besoin
  const handleStatusChange = useCallback(async (newStatus: string) => {
    if (!situation?.id) return;
    setStatusSaving(true);
    try {
      await updateInterventionStatus(situation.id, newStatus);
      loadDetail(situation.id);
      onRefresh?.();
    } catch (err: unknown) {
      if (!(err instanceof Error && err.message === 'AUDIT_CANCELLED')) {
        loadDetail(situation.id);
        onRefresh?.();
      }
    } finally {
      setStatusSaving(false);
    }
  }, [situation?.id, loadDetail, onRefresh]);

  const handlePrioritySelect = useCallback(async (priority: string) => {
    if (!situation?.id) return;
    setPrioritySaving(true);
    try {
      await updateIntervention(situation.id, { priority });
      loadDetail(situation.id);
      onRefresh?.();
    } catch (err: unknown) {
      if (!(err instanceof Error && err.message === 'AUDIT_CANCELLED')) {
        loadDetail(situation.id);
        onRefresh?.();
      }
    } finally {
      setPrioritySaving(false);
    }
  }, [situation?.id, loadDetail, onRefresh]);

  const saveField = useCallback((taskId: string, field: string, value: string | null, onDone: () => void) => {
    patchInterventionTask(taskId, { [field]: value ?? null })
      .then(onDone)
      .catch(() => {});
  }, []);

  const handleMove = useCallback((task: InterventionTask, idx: number, direction: number) => {
    if (!situation?.id) return;
    const sorted  = [...tasks].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const swap      = sorted[swapIdx];
    const newOrder  = swap.sort_order ?? swapIdx;
    const taskOrder = task.sort_order ?? idx;
    setTasks((prev) => prev.map((t) => {
      if (t.id === task.id) return { ...t, sort_order: newOrder };
      if (t.id === swap.id) return { ...t, sort_order: taskOrder };
      return t;
    }));
    Promise.all([
      patchInterventionTask(task.id, { sort_order: newOrder }),
      patchInterventionTask(swap.id, { sort_order: taskOrder }),
    ]).catch(() => loadDetail(situation.id));
  }, [tasks, setTasks, situation?.id, loadDetail]);

  return {
    statusSaving, handleStatusChange,
    prioritySaving, handlePrioritySelect,
    error, setError,
    saveField, handleMove,
  };
}
