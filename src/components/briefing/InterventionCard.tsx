import { useState, useEffect, useCallback } from 'react';
import { fetchIntervention } from '@/api/interventions';
import { fetchAuditLogs } from '@/api/auditLogs';
import { useTaskCreate } from '@/hooks/tasks/useTaskCreate';
import { IvHeader } from './components/IvHeader';
import { IvBody, EmptyState } from './components/IvBody';
import { useCardDisplay, useCardActions } from './useInterventionCard';
import type { BriefingSituation, InterventionDetail, InterventionTask } from '@/types/briefing';

interface InterventionCardProps {
  situation: BriefingSituation | null;
  onRefresh?: () => void;
}

function collectAuditLogs(
  id: string,
  taskIds: string[],
  fromDt: string | undefined,
  set: (v: unknown[]) => void,
) {
  Promise.allSettled([
    fetchAuditLogs({ entity_id: id, entity_type: 'intervention', limit: 200 }),
    ...taskIds.map((tid) =>
      fetchAuditLogs({ entity_id: tid, entity_type: 'task', limit: 100, ...(fromDt ? { from_dt: fromDt } : {}) })
    ),
  ]).then((results) => {
    const logs: unknown[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') {
        const val = r.value as { items?: unknown[] };
        if (Array.isArray(val?.items)) logs.push(...val.items);
      }
    }
    set(logs);
  });
}

function useIvDetail(situationId: string | undefined) {
  const [detail, setDetail]       = useState<InterventionDetail | null>(null);
  const [tasks, setTasks]         = useState<InterventionTask[]>([]);
  const [auditLogs, setAuditLogs] = useState<unknown[]>([]);
  const [loading, setLoading]     = useState(false);

  const loadDetail = useCallback((id: string) => {
    setDetail(null); setTasks([]); setAuditLogs([]);
    setLoading(true);
    (fetchIntervention(id) as unknown as Promise<InterventionDetail>)
      .then((iv) => {
        setDetail(iv);
        const ivTasks = Array.isArray(iv.tasks) ? iv.tasks : [];
        setTasks(ivTasks);
        const taskIds = ivTasks.map((t) => String(t.id));
        const fromDt  = iv.reportedDate ? new Date(iv.reportedDate).toISOString() : undefined;
        collectAuditLogs(id, taskIds, fromDt, setAuditLogs);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (situationId) loadDetail(situationId);
  }, [situationId, loadDetail]);

  return { detail, tasks, setTasks, auditLogs, loading, loadDetail };
}

export function InterventionCard({ situation, onRefresh }: InterventionCardProps) {
  const { detail, tasks, setTasks, auditLogs, loading, loadDetail } = useIvDetail(situation?.id);
  const [showForm, setShowForm] = useState(false);
  const [editCell, setEditCell] = useState<{ taskId: string; field: string } | null>(null);

  const display = useCardDisplay(situation, detail);
  const actions = useCardActions(situation, tasks, setTasks, loadDetail, onRefresh);

  const startEdit  = useCallback((taskId: string, field: string) => setEditCell({ taskId, field }), []);
  const cancelEdit = useCallback(() => setEditCell(null), []);

  const onSaveField = useCallback((taskId: string, field: string, value: string | null) => {
    actions.saveField(taskId, field, value, () => {
      setEditCell(null);
      if (situation?.id) loadDetail(situation.id);
    });
  }, [actions, situation?.id, loadDetail]);

  const taskCreate = useTaskCreate({
    interventionId: situation ? String(situation.id) : null,
    onSuccess: () => {
      setShowForm(false);
      if (situation?.id) loadDetail(situation.id);
      onRefresh?.();
    },
  });

  if (!situation) return <EmptyState />;

  const sortedTasks  = [...tasks].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const criticalTask = sortedTasks.find((t) => !['done', 'skipped'].includes(t.status) && t.due_date)
    ?? sortedTasks.find((t) => t.status === 'in_progress')
    ?? sortedTasks[0];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <IvHeader
        situation={situation}
        detail={detail}
        currentStatus={display.currentStatus}
        statusCfg={display.statusCfg}
        priorityCfg={display.priorityCfg}
        typeLabel={display.typeLabel}
        actionCount={display.actionCount}
        totalTime={display.totalTime}
        purchaseCount={display.purchaseCount}
        completionPct={display.completionPct}
        hasTasks={sortedTasks.length > 0}
        criticalTask={criticalTask}
        urgency={display.urgency}
        openFmt={display.openFmt}
        closeFmt={display.closeFmt}
        daysOpen={situation.daysOpen ?? 0}
        onSelectStatus={actions.setPendingStatus}
        pendingStatus={actions.pendingStatus}
        onClosePending={actions.closePending}
        onConfirmStatus={actions.handleStatusConfirm}
        statusSaving={actions.statusSaving}
      />
      <IvBody
        situation={situation}
        detail={detail}
        loading={loading}
        sortedTasks={sortedTasks}
        criticalTask={criticalTask}
        auditLogs={auditLogs}
        editCell={editCell}
        editSaving={null}
        showForm={showForm}
        taskCreate={taskCreate}
        onStartEdit={startEdit}
        onSaveField={onSaveField}
        onCancelEdit={cancelEdit}
        onMoveUp={(task, idx) => actions.handleMove(task as InterventionTask, idx, -1)}
        onMoveDown={(task, idx) => actions.handleMove(task as InterventionTask, idx, 1)}
        onShowForm={setShowForm}
      />
    </div>
  );
}
