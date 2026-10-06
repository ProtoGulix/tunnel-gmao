import type { FC } from 'react';
import { Flex, Text, Badge, Spinner, Button } from '@radix-ui/themes';
import { Clock, Plus, ClipboardList, Circle, CheckCircle2, MinusCircle } from 'lucide-react';
import { STATUS_CONFIG } from '@/config/interventionTypes';
import TaskCreateForm from '@/components/tasks/TaskCreateForm';
import { TaskCard } from './TaskCard';
import type { InterventionDetail, InterventionAction } from '@/types/briefing';
import type { BriefingSituation } from '@/types/briefing';

const STATUS_GROUP_CFG = [
  { key: 'in_progress', Icon: Clock,        color: 'var(--blue-9)',   label: 'En cours' },
  { key: 'todo',        Icon: Circle,        color: 'var(--gray-7)',   label: 'À faire' },
  { key: 'done',        Icon: CheckCircle2,  color: 'var(--green-9)',  label: 'Terminée' },
  { key: 'skipped',     Icon: MinusCircle,   color: 'var(--orange-9)', label: 'Ignorée' },
] as const;

const DECISION_LABELS: Record<string, string> = {
  status_actual_changed: 'Statut modifié',
  priority_changed:      'Priorité modifiée',
  assigned_to_changed:   'Technicien modifié',
  due_date_changed:      'Échéance modifiée',
  status_changed:        'Statut modifié',
  created:               'Créé',
  deleted:               'Supprimé',
  sort_order_changed:    'Ordre modifié',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IvAuditLogLine: FC<{ log: any }> = ({ log }) => {
  const reasonColor   = log.reason?.color ?? 'var(--gray-7)';
  const decisionLabel = DECISION_LABELS[log.decision_type] ?? log.decision_type;
  const who  = log.changed_by?.initials ?? log.changed_by?.first_name ?? '?';
  const when = log.logged_at
    ? new Date(log.logged_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
    : null;

  const valueStr = (() => {
    const nv = log.new_value;
    if (!nv) return null;
    if (log.decision_type === 'status_actual_changed' || log.decision_type === 'status_changed') {
      const from = log.old_value?.status_actual ?? log.old_value?.status;
      const to   = nv.status_actual ?? nv.status;
      return from && to ? `${from} → ${to}` : (to ?? null);
    }
    if (log.decision_type === 'priority_changed') {
      const from = log.old_value?.priority;
      const to   = nv.priority;
      return from && to ? `${from} → ${to}` : (to ?? null);
    }
    if (log.decision_type === 'assigned_to_changed') {
      const from = log.old_value?.assigned_to?.initials;
      const to   = nv.assigned_to?.initials;
      return from && to ? `${from} → ${to}` : (to ?? null);
    }
    if (log.decision_type === 'due_date_changed') {
      const fmt = (d: string) => new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
      const from = log.old_value?.due_date ? fmt(log.old_value.due_date) : '—';
      const to   = nv.due_date ? fmt(nv.due_date) : '—';
      return `${from} → ${to}`;
    }
    return null;
  })();

  return (
    <Flex align="center" gap="2" style={{ flexWrap: 'wrap', padding: '3px 4px', borderRadius: 4, cursor: 'default' }}>
      <div style={{ width: 8, height: 8, flexShrink: 0, background: reasonColor, transform: 'rotate(45deg)' }} />
      <Text size="1" style={{ color: 'var(--gray-11)', flexShrink: 0 }}>{decisionLabel}</Text>
      {valueStr && <Text size="1" style={{ color: 'var(--gray-10)', fontFamily: 'monospace', flexShrink: 0 }}>{valueStr}</Text>}
      {log.reason && !log.is_system && (
        <Badge size="1" variant="soft" style={{ background: reasonColor + '22', color: reasonColor, flexShrink: 0 }}>
          {log.reason.label}
        </Badge>
      )}
      <Text size="1" color="gray" style={{ marginLeft: 'auto', flexShrink: 0, fontFamily: 'monospace' }}>
        {who}{when ? ` · ${when}` : ''}
      </Text>
    </Flex>
  );
};

function UnlinkedActions({ actions }: { actions: InterventionAction[] }) {
  if (actions.length === 0) return null;
  return (
    <div style={{ border: '1px solid var(--gray-4)', borderRadius: 8, overflow: 'hidden', background: 'var(--color-panel-solid)' }}>
      <Flex align="center" gap="2" style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-3)' }}>
        <Clock size={13} color="var(--gray-9)" />
        <Text size="2" weight="medium" color="gray">Actions non liées à une tâche</Text>
      </Flex>
      <div style={{ padding: '6px 12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {actions.map((a) => {
          const code  = (a as any).subcategory?.code ?? '—';
          const color = (a as any).subcategory?.category?.color ?? '#6b7280';
          const date  = a.date ? new Date(a.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric' }) : null;
          return (
            <Flex key={a.id} align="center" gap="2" style={{ flexWrap: 'wrap', padding: '3px 4px' }}>
              <Text size="1" style={{ color, fontFamily: 'monospace', fontWeight: 700 }}>{code}</Text>
              {date && <Text size="1" color="gray">({date}{a.timeSpent ? `, ${a.timeSpent}h` : ''})</Text>}
              {a.description && <Text size="1" style={{ color: 'var(--gray-9)', fontStyle: 'italic' }}>{a.description}</Text>}
            </Flex>
          );
        })}
      </div>
    </div>
  );
}

export function EmptyState() {
  return (
    <Flex align="center" justify="center" direction="column" gap="3"
      style={{ height: '100%', color: 'var(--gray-8)' }}>
      <ClipboardList size={32} strokeWidth={1.5} />
      <Text size="2" color="gray">Sélectionne une intervention</Text>
    </Flex>
  );
}

interface IvBodyProps {
  situation: BriefingSituation;
  detail: InterventionDetail | null;
  loading: boolean;
  sortedTasks: any[];
  criticalTask: any;
  auditLogs: any[];
  editCell: { taskId: string; field: string } | null;
  editSaving: string | null;
  showForm: boolean;
  taskCreate: any;
  onStartEdit: (taskId: string, field: string) => void;
  onSaveField: (taskId: string, field: string, value: string | null) => void;
  onCancelEdit: () => void;
  onMoveUp: (task: any, idx: number) => void;
  onMoveDown: (task: any, idx: number) => void;
  onShowForm: (v: boolean) => void;
}

export function IvBody({
  situation, detail, loading, sortedTasks, criticalTask, auditLogs,
  editCell, editSaving, showForm, taskCreate,
  onStartEdit, onSaveField, onCancelEdit, onMoveUp, onMoveDown, onShowForm,
}: IvBodyProps) {
  const unlinkedActions = (detail?.action ?? []).filter((a) => {
    const tid = a.task?.id ?? null;
    return !tid || !sortedTasks.some((t: any) => String(t.id) === String(tid));
  });

  const ivAuditLogs = auditLogs
    .filter((l: any) => String(l.entity_type) === 'intervention' && String(l.entity_id) === String(situation.id))
    .filter((l: any) => l.decision_type !== 'status_actual_changed')
    .sort((a: any, b: any) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime());

  return (
    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      {loading && <Flex justify="center" pt="4"><Spinner size="2" /></Flex>}

      {!loading && (
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sortedTasks.length === 0 && (
            <Text size="2" color="gray" style={{ fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
              Aucune tâche liée à cette intervention
            </Text>
          )}
          {STATUS_GROUP_CFG.map(({ key, Icon, color, label }) => {
            const group = sortedTasks.filter((t: any) => t.status === key);
            if (group.length === 0) return null;
            return (
              <div key={key}>
                <Flex align="center" gap="2" style={{ padding: '2px 4px 6px' }}>
                  <Icon size={12} color={color} />
                  <Text size="1" weight="medium" style={{ color }}>{label}</Text>
                  <Badge size="1" variant="soft" color="gray">{group.length}</Badge>
                </Flex>
                <Flex direction="column" gap="2">
                  {group.map((task: any) => {
                    const idx = sortedTasks.indexOf(task);
                    return (
                      <TaskCard
                        key={task.id}
                        task={task}
                        isCritical={criticalTask?.id === task.id}
                        actions={detail?.action ?? []}
                        reportedDate={situation.reportedDate ?? null}
                        auditLogs={auditLogs}
                        editCell={editCell}
                        onStartEdit={onStartEdit}
                        onSaveField={onSaveField}
                        onCancelEdit={onCancelEdit}
                        onMoveUp={() => onMoveUp(task, idx)}
                        onMoveDown={() => onMoveDown(task, idx)}
                        isFirst={idx === 0}
                        isLast={idx === sortedTasks.length - 1}
                        users={taskCreate.users}
                        editSaving={editSaving ?? null}
                      />
                    );
                  })}
                </Flex>
              </div>
            );
          })}
          <UnlinkedActions actions={unlinkedActions} />
          {showForm ? (
            <TaskCreateForm
              formData={taskCreate.formData}
              set={taskCreate.set}
              users={taskCreate.users}
              saving={taskCreate.saving}
              errors={taskCreate.errors}
              onSubmit={taskCreate.handleSubmit}
              onCancel={() => { taskCreate.reset(); onShowForm(false); }}
              interventionId={String(situation.id)}
              interventionLabel={`${situation.code} — ${situation.title}`}
              embedded
              size="2"
            />
          ) : (
            <Button size="1" variant="soft" color="blue" onClick={() => onShowForm(true)} style={{ alignSelf: 'flex-start' }}>
              <Plus size={13} /> Ajouter une tâche
            </Button>
          )}
        </div>
      )}

      {detail?.statusLogs && detail.statusLogs.length > 0 && (
        <div style={{ padding: '10px 14px', borderTop: '1px solid var(--gray-4)' }}>
          <Flex align="center" gap="2" mb="2">
            <Clock size={13} color="var(--gray-9)" />
            <Text size="2" weight="bold" color="gray">Changements de statut</Text>
          </Flex>
          <Flex gap="2" style={{ flexWrap: 'wrap' }}>
            {[...detail.statusLogs]
              .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              .map((log, i) => {
                const cfg = STATUS_CONFIG[log.status_to_detail?.id ?? ''];
                if (!cfg) return null;
                const openDate = situation.reportedDate ? new Date(situation.reportedDate) : null;
                const daysLabel = openDate && log.date
                  ? `J+${Math.floor((new Date(log.date).getTime() - openDate.getTime()) / 86400000)}`
                  : null;
                return (
                  <Flex key={i} direction="column" align="center" gap="0" style={{ minWidth: 60 }}>
                    {daysLabel && <Text size="1" color="gray" style={{ fontFamily: 'monospace' }}>{daysLabel}</Text>}
                    <Badge size="1" color={cfg.color as any} variant="soft">{cfg.label}</Badge>
                  </Flex>
                );
              })}
          </Flex>
        </div>
      )}

      {ivAuditLogs.length > 0 && (
        <div style={{ padding: '6px 14px 10px', borderTop: '1px solid var(--gray-4)' }}>
          <Text size="1" weight="medium" color="gray" style={{ display: 'block', marginBottom: 4 }}>
            Modifications de l&apos;intervention
          </Text>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {ivAuditLogs.map((log: any, i: number) => (
              <IvAuditLogLine key={log.id ?? i} log={log} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
