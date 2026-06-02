import { useState, type FC } from 'react';
import { Flex, Text, Badge, IconButton } from '@radix-ui/themes';
import {
  CheckCircle2, Circle, Clock, MinusCircle,
  AlertTriangle, User, CalendarClock, UserCog, Wrench,
} from 'lucide-react';
import { GanttTimeline } from './GanttTimeline';
import type { InterventionTask, InterventionAction } from '@/types/briefing';

/* ── Config ────────────────────────────────────────────────────────────────── */

const TASK_STATUS_CFG = {
  todo:        { Icon: Circle,       color: 'var(--gray-7)',   label: 'À faire' },
  in_progress: { Icon: Clock,        color: 'var(--blue-9)',   label: 'En cours' },
  done:        { Icon: CheckCircle2, color: 'var(--green-9)',  label: 'Terminée' },
  skipped:     { Icon: MinusCircle,  color: 'var(--orange-9)', label: 'Ignorée' },
} as const;

const ORIGIN_CFG = {
  plan: { Icon: CalendarClock, color: 'var(--violet-9)', label: 'Préventif' },
  resp: { Icon: UserCog,       color: 'var(--orange-9)', label: 'Responsable' },
  tech: { Icon: Wrench,        color: 'var(--blue-9)',   label: 'Technicien' },
} as const;

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

/* ── Props ─────────────────────────────────────────────────────────────────── */

export interface TaskCardProps {
  task: InterventionTask & { sort_order?: number; optional?: boolean; skip_reason?: string; origin?: string; gamme_step_id?: string };
  isCritical: boolean;
  actions: InterventionAction[];
  reportedDate: string | null;
  auditLogs: any[];
  editCell: { taskId: string; field: string } | null;
  onStartEdit: (taskId: string, field: string) => void;
  onSaveField: (taskId: string, field: string, value: string | null) => void;
  onCancelEdit: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst: boolean;
  isLast: boolean;
  users: any[];
  editSaving: string | null;
}

/* ── Sous-composants locaux ────────────────────────────────────────────────── */

const AuditLogLine: FC<{ log: any; isHovered: boolean; onHover?: (id: string | null) => void }> = ({ log, isHovered, onHover }) => {
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
      if (from && to) return `${from} → ${to}`;
      return to ?? null;
    }
    if (log.decision_type === 'priority_changed') {
      const from = log.old_value?.priority;
      const to   = nv.priority;
      if (from && to) return `${from} → ${to}`;
      return to ?? null;
    }
    if (log.decision_type === 'assigned_to_changed') {
      const from = log.old_value?.assigned_to?.initials;
      const to   = nv.assigned_to?.initials;
      if (from && to) return `${from} → ${to}`;
      return to ?? null;
    }
    if (log.decision_type === 'due_date_changed') {
      const from = log.old_value?.due_date ? new Date(log.old_value.due_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : '—';
      const to   = nv.due_date ? new Date(nv.due_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) : '—';
      return `${from} → ${to}`;
    }
    return null;
  })();

  return (
    <Flex align="center" gap="2"
      onMouseEnter={() => onHover?.(log.id)}
      onMouseLeave={() => onHover?.(null)}
      style={{
        flexWrap: 'wrap', padding: '3px 4px', borderRadius: 4,
        background: isHovered ? `${reasonColor}18` : 'transparent',
        outline: isHovered ? `1px solid ${reasonColor}55` : '1px solid transparent',
        transition: 'background 0.15s, outline 0.15s',
        cursor: 'default',
      }}
    >
      <div style={{
        width: 8, height: 8, flexShrink: 0, background: reasonColor,
        transform: `rotate(45deg) scale(${isHovered ? 1.2 : 1})`,
        transition: 'transform 0.15s',
        boxShadow: isHovered ? `0 0 0 2px ${reasonColor}55` : 'none',
      }} />
      <Text size="1" style={{ color: 'var(--gray-11)', flexShrink: 0 }}>{decisionLabel}</Text>
      {valueStr && (
        <Text size="1" style={{ color: isHovered ? 'var(--gray-12)' : 'var(--gray-10)', fontFamily: 'monospace', flexShrink: 0, transition: 'color 0.15s' }}>
          {valueStr}
        </Text>
      )}
      {log.reason && !log.is_system && (
        <Badge size="1" variant="soft" style={{ background: reasonColor + '22', color: reasonColor, flexShrink: 0 }}>
          {log.reason.label}
        </Badge>
      )}
      {log.reason_text && (
        <Text size="1" style={{ color: 'var(--gray-9)', fontStyle: 'italic', flexShrink: 0 }}>"{log.reason_text}"</Text>
      )}
      <Text size="1" color="gray" style={{ marginLeft: 'auto', flexShrink: 0, fontFamily: 'monospace' }}>
        {who}{when ? ` · ${when}` : ''}
      </Text>
    </Flex>
  );
};

const ActionContextLine: FC<{ action: any; isHovered?: boolean; onHover?: (id: string | null) => void }> = ({ action, isHovered, onHover }) => {
  const subcatCode  = action.subcategory?.code ?? action.subcategory?.label ?? '—';
  const subcatColor = action.subcategory?.category?.color ?? '#6b7280';
  const dateStr     = action.date
    ? new Date(action.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric' })
    : null;
  const duration    = action.timeSpent ?? null;
  const tech        = action.technician;
  const techInitials = tech?.initial
    ?? (tech ? `${tech.firstName?.[0] ?? ''}${tech.lastName?.[0] ?? ''}`.toUpperCase() || null : null);
  const daRefs = (action.purchaseRequests ?? [])
    .map((pr: any) => pr.code ?? pr.reference ?? pr.da_number)
    .filter(Boolean);

  return (
    <Flex align="center" gap="2" style={{
      flexWrap: 'wrap', padding: '3px 4px', borderRadius: 4,
      background: isHovered ? `${subcatColor}18` : 'transparent',
      outline: isHovered ? `1px solid ${subcatColor}55` : '1px solid transparent',
      transition: 'background 0.15s, outline 0.15s',
      cursor: 'default',
    }}
      onMouseEnter={() => onHover?.(action.id)}
      onMouseLeave={() => onHover?.(null)}
    >
      {action.num != null && (
        <div style={{
          width: 14, height: 14, borderRadius: '50%', background: subcatColor,
          transform: isHovered ? 'scale(1.2)' : 'scale(1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          transition: 'transform 0.15s',
          boxShadow: isHovered ? `0 0 0 2px ${subcatColor}55` : 'none',
        }}>
          <Text size="1" style={{ fontSize: 8, color: '#fff', fontWeight: 700, lineHeight: 1, fontFamily: 'monospace' }}>{action.num}</Text>
        </div>
      )}
      <Text size="1" style={{ color: subcatColor, fontFamily: 'monospace', fontWeight: 700, flexShrink: 0 }}>{subcatCode}</Text>
      {dateStr && (
        <Text size="1" color="gray" style={{ flexShrink: 0 }}>
          ({dateStr}{duration != null ? `, ${duration}h` : ''})
        </Text>
      )}
      {techInitials && (
        <Text size="1" weight="medium" style={{ color: 'var(--gray-11)', flexShrink: 0 }}>{techInitials}</Text>
      )}
      {action.description && (
        <Text size="1" style={{ color: isHovered ? 'var(--gray-12)' : 'var(--gray-9)', fontStyle: 'italic', minWidth: 0, transition: 'color 0.15s' }}>
          {action.description}
        </Text>
      )}
      {daRefs.map((ref: string) => (
        <Badge key={ref} size="1" variant="soft" color="orange" style={{ fontFamily: 'monospace', flexShrink: 0 }}>
          [{ref}]
        </Badge>
      ))}
    </Flex>
  );
};

/* ── Résumé compact des actions (une ligne sous la frise) ─────────────────── */

function ActionsSummary({ taskActions }: { taskActions: any[] }) {
  if (taskActions.length === 0) return null;

  const totalTime = taskActions.reduce((s: number, a: any) => s + (a.timeSpent ?? 0), 0);
  const daCount   = taskActions.filter((a: any) => a.purchaseRequests?.length > 0).length;

  // Codes actions uniques (max 4 affichés)
  const codes = taskActions
    .map((a: any) => a.subcategory?.code ?? null)
    .filter(Boolean) as string[];
  const uniqueCodes = [...new Set(codes)];
  const shown   = uniqueCodes.slice(0, 4);
  const hidden  = uniqueCodes.length - shown.length;

  return (
    <Flex align="center" gap="2" style={{ flexWrap: 'wrap', padding: '6px 14px 2px' }}>
      <Flex align="center" gap="1">
        <Clock size={11} color="var(--gray-8)" />
        <Text size="1" color="gray">
          <strong>{taskActions.length}</strong> action{taskActions.length > 1 ? 's' : ''} · <strong>{totalTime}h</strong>
        </Text>
      </Flex>
      {shown.map((code) => (
        <Badge key={code} size="1" variant="soft" color="gray" style={{ fontFamily: 'monospace' }}>
          {code}
        </Badge>
      ))}
      {hidden > 0 && (
        <Text size="1" color="gray">+{hidden}</Text>
      )}
      {daCount > 0 && (
        <Badge size="1" variant="soft" color="orange">
          {daCount} DA
        </Badge>
      )}
    </Flex>
  );
}

/* ── TaskCard principal ────────────────────────────────────────────────────── */

export const TaskCard: FC<TaskCardProps> = ({
  task, isCritical, actions, reportedDate, auditLogs,
  editCell, onStartEdit, onSaveField, onCancelEdit,
  onMoveUp, onMoveDown, isFirst, isLast, users, editSaving,
}) => {
  const cfg    = TASK_STATUS_CFG[task.status as keyof typeof TASK_STATUS_CFG] ?? TASK_STATUS_CFG.todo;
  const today  = new Date(); today.setHours(0, 0, 0, 0);
  const overdue = task.due_date && new Date(task.due_date) < today;
  const dueFmt  = task.due_date
    ? new Date(task.due_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : null;
  const assignedTo = task.assigned_to ?? null;
  const initials   = assignedTo
    ? ((assignedTo as any).initial ?? `${(assignedTo as any).first_name?.[0] ?? ''}${(assignedTo as any).last_name?.[0] ?? ''}`).toUpperCase()
    : null;

  const editingDue    = editCell?.taskId === task.id && editCell?.field === 'due_date';
  const editingAssign = editCell?.taskId === task.id && editCell?.field === 'assigned_to';
  const isDone = task.status === 'done' || task.status === 'skipped';

  // hover unifié sur id (string) pour synchroniser frise ↔ liste
  const [hoveredActionId, setHoveredActionId] = useState<string | null>(null);
  const [hoveredLogId, setHoveredLogId]       = useState<string | null>(null);

  const taskAuditLogs = (auditLogs ?? [])
    .filter((l: any) => String(l.entity_id) === String(task.id))
    .filter((l: any) => !l.is_system || l.decision_type !== 'sort_order_changed')
    .sort((a: any, b: any) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime());

  const taskActions: InterventionAction[] = (actions ?? []).filter((a) => {
    const linkedId = a.task?.id ?? null;
    return linkedId !== null && String(linkedId) === String(task.id);
  });

  const enrichedActions = [...taskActions]
    .map((a) => {
      const ref = reportedDate ? new Date(reportedDate) : null;
      if (ref) ref.setHours(0, 0, 0, 0);
      const day = ref && a.date
        ? Math.floor((new Date(a.date).setHours(0, 0, 0, 0) - ref.getTime()) / 86400000)
        : null;
      return { ...a, day };
    })
    .sort((a, b) => (a.day ?? 9999) - (b.day ?? 9999))
    .map((a, i) => ({ ...a, num: i + 1 }));

  const hasGantt = !!reportedDate;

  const effectiveCritical = isCritical && !isDone;

  const headerBg = isDone
    ? 'var(--gray-2)'
    : effectiveCritical
      ? 'var(--accent-2)'
      : task.status === 'in_progress'
        ? cfg.color + '18'
        : 'var(--gray-2)';

  const borderColor = isDone
    ? 'var(--gray-4)'
    : effectiveCritical
      ? 'var(--accent-6)'
      : cfg.color + '55';

  return (
    <div style={{
      border: `1px solid ${borderColor}`,
      borderRadius: 8,
      overflow: 'hidden',
      opacity: editSaving === task.id ? 0.6 : 1,
      transition: 'opacity 0.15s',
    }}>

      {/* ── En-tête tâche ── */}
      <Flex align="center" gap="2" style={{ padding: '8px 10px', background: headerBg, borderBottom: `1px solid ${effectiveCritical ? 'var(--accent-4)' : cfg.color + '30'}` }}>
        {/* Réordonnancement */}
        <Flex direction="column" gap="0" style={{ flexShrink: 0 }}>
          <IconButton size="1" variant="ghost" color="gray" disabled={isFirst || isDone}
            onClick={(e) => { e.stopPropagation(); onMoveUp?.(); }}>
            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 2 L9 8 L1 8 Z" fill="currentColor" /></svg>
          </IconButton>
          <IconButton size="1" variant="ghost" color="gray" disabled={isLast || isDone}
            onClick={(e) => { e.stopPropagation(); onMoveDown?.(); }}>
            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M5 8 L1 2 L9 2 Z" fill="currentColor" /></svg>
          </IconButton>
        </Flex>

        {/* Icône statut */}
        <cfg.Icon size={15} color={effectiveCritical ? 'var(--accent-9)' : cfg.color} style={{ flexShrink: 0 }} />

        {/* Titre + badges */}
        <Flex direction="column" gap="0" style={{ flex: 1, minWidth: 0 }}>
          <Flex align="center" gap="2">
            <Text
              size="2"
              weight={task.status === 'in_progress' ? 'bold' : 'medium'}
              style={{
                color: isDone ? 'var(--gray-9)' : 'var(--gray-12)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                textDecoration: task.status === 'done' ? 'line-through' : 'none',
              }}
            >
              {task.label}
            </Text>
            {task.optional && (
              <Badge size="1" variant="soft" color="gray" style={{ flexShrink: 0 }}>opt.</Badge>
            )}
          </Flex>

          {/* Statut + origine sur la même ligne secondaire */}
          <Flex align="center" gap="2" mt="1" style={{ flexWrap: 'wrap' }}>
            <Badge
              size="1"
              variant={task.status === 'in_progress' ? 'solid' : 'outline'}
              style={{
                background: task.status === 'in_progress' ? cfg.color : 'transparent',
                color: task.status === 'in_progress' ? '#fff' : cfg.color,
                borderColor: cfg.color + '88',
                flexShrink: 0,
              }}
            >
              {cfg.label}
            </Badge>
            {task.status === 'skipped' && task.skip_reason && (
              <Text size="1" color="orange" style={{ fontStyle: 'italic', flexShrink: 0 }}>{task.skip_reason}</Text>
            )}
            {task.origin && ORIGIN_CFG[task.origin as keyof typeof ORIGIN_CFG] && (() => {
              const oc = ORIGIN_CFG[task.origin as keyof typeof ORIGIN_CFG];
              return (
                <>
                  <oc.Icon size={11} color={oc.color} style={{ flexShrink: 0 }} />
                  <Text size="1" style={{ color: oc.color, flexShrink: 0 }}>{oc.label}</Text>
                  <Badge size="1" color={task.gamme_step_id ? 'green' : 'gray'} variant="soft" style={{ flexShrink: 0 }}>
                    {task.gamme_step_id ? 'Gamme' : 'Manuelle'}
                  </Badge>
                </>
              );
            })()}
            <Text size="1" color="gray" style={{ fontFamily: 'monospace', flexShrink: 0, marginLeft: 'auto' }}>
              #{task.sort_order ?? '—'}
            </Text>
          </Flex>
        </Flex>

        {/* Assigné */}
        {editingAssign && !isDone ? (
          <select
            autoFocus // eslint-disable-line jsx-a11y/no-autofocus
            defaultValue={String((assignedTo as any)?.id ?? '')}
            onChange={(e) => onSaveField(task.id, 'assigned_to', e.target.value || null)}
            onBlur={(e) => { if (e.target.value === String((assignedTo as any)?.id ?? '')) onCancelEdit(); }}
            onKeyDown={(e) => { if (e.key === 'Escape') onCancelEdit(); }}
            onClick={(e) => e.stopPropagation()}
            style={{ fontSize: 11, padding: '1px 4px', borderRadius: 4, border: '1px solid var(--accent-8)', background: 'var(--color-background)', color: 'var(--gray-12)', outline: 'none', maxWidth: 130 }}
          >
            <option value="">— Non assigné</option>
            {(users ?? []).map((u: any) => (
              <option key={u.id} value={String(u.id)}>
                {`${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || String(u.id)}
              </option>
            ))}
          </select>
        ) : (
          <button
            type="button"
            title={isDone ? undefined : (initials ? "Modifier l'assigné" : 'Assigner')}
            onClick={(e) => { if (isDone) return; e.stopPropagation(); onStartEdit(task.id, 'assigned_to'); }}
            style={{
              background: initials ? (isDone ? 'var(--gray-3)' : 'var(--accent-4)') : 'var(--gray-3)',
              border: '1px solid',
              borderColor: initials && !isDone ? 'var(--accent-6)' : 'var(--gray-5)',
              borderRadius: '50%', width: 26, height: 26,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: isDone ? 'default' : 'pointer', padding: 0, flexShrink: 0,
            }}
          >
            {initials
              ? <Text size="1" weight="bold" style={{ color: isDone ? 'var(--gray-9)' : 'var(--accent-11)', fontSize: 9, lineHeight: 1 }}>{initials}</Text>
              : <User size={12} color="var(--gray-9)" />
            }
          </button>
        )}

        {/* Échéance */}
        {editingDue && !isDone ? (
          <input
            autoFocus // eslint-disable-line jsx-a11y/no-autofocus
            type="date"
            defaultValue={task.due_date?.slice(0, 10) ?? ''}
            onBlur={(e) => {
              const v = e.target.value;
              if (v !== (task.due_date?.slice(0, 10) ?? '')) onSaveField(task.id, 'due_date', v || null);
              else onCancelEdit();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              if (e.key === 'Escape') onCancelEdit();
            }}
            onClick={(e) => e.stopPropagation()}
            style={{ fontSize: 11, padding: '1px 4px', borderRadius: 4, border: '1px solid var(--accent-8)', background: 'var(--color-background)', color: 'var(--gray-12)', outline: 'none', width: 110 }}
          />
        ) : (
          <button
            type="button"
            title={isDone ? undefined : "Modifier l'échéance"}
            onClick={(e) => { if (isDone) return; e.stopPropagation(); onStartEdit(task.id, 'due_date'); }}
            style={{ background: 'none', border: 'none', padding: '1px 3px', borderRadius: 4, cursor: isDone ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}
          >
            {overdue && dueFmt && !isDone
              ? <Badge color="red" variant="solid" size="1" style={{ display: 'flex', alignItems: 'center', gap: 3, pointerEvents: 'none' }}>
                  <AlertTriangle size={10} />{dueFmt}
                </Badge>
              : dueFmt
                ? <Text size="1" color="gray">{dueFmt}</Text>
                : !isDone
                  ? <Text size="1" style={{ color: 'var(--gray-5)' }}>+ date</Text>
                  : null
            }
          </button>
        )}

        {/* Temps passé */}
        {(task as any).action_count > 0 && (
          <Flex align="center" gap="1" style={{ flexShrink: 0 }}>
            <Clock size={11} color="var(--gray-8)" />
            <Text size="1" color="gray">{(task as any).action_count} · {(task as any).time_spent}h</Text>
          </Flex>
        )}
      </Flex>

      {/* ── Frise Gantt full-width — hover bidirectionnel ── */}
      {hasGantt && (
        <div style={{ padding: '0 12px', borderTop: '1px solid var(--gray-3)' }}>
          <GanttTimeline
            task={task}
            actions={actions}
            auditLogs={auditLogs}
            reportedDate={reportedDate}
            hoveredActionId={hoveredActionId}
            hoveredLogId={hoveredLogId}
            onHoverAction={setHoveredActionId}
            onHoverLog={setHoveredLogId}
          />
        </div>
      )}

      {/* ── Résumé compact des actions ── */}
      {enrichedActions.length > 0 && <ActionsSummary taskActions={enrichedActions} />}

      {/* ── Liste détaillée des actions ── */}
      {enrichedActions.length > 0 && (
        <div style={{ padding: '4px 12px 6px', display: 'flex', flexDirection: 'column', gap: 2, borderTop: '1px solid var(--gray-3)' }}>
          {enrichedActions.map((a: any) => (
            <ActionContextLine
              key={a.id}
              action={a}
              isHovered={hoveredActionId === a.id}
              onHover={(id) => setHoveredActionId(id ?? null)}
            />
          ))}
        </div>
      )}

      {/* ── Historique audit tâche ── */}
      {taskAuditLogs.length > 0 && (
        <div style={{
          padding: '4px 12px 8px',
          borderTop: '1px solid var(--gray-3)',
          display: 'flex', flexDirection: 'column', gap: 1,
        }}>
          <Text size="1" color="gray" weight="medium" style={{ marginBottom: 2 }}>Historique :</Text>
          {taskAuditLogs.map((log: any, i: number) => (
            <AuditLogLine
              key={log.id ?? i}
              log={log}
              isHovered={hoveredLogId === log.id}
              onHover={setHoveredLogId}
            />
          ))}
        </div>
      )}
    </div>
  );
};
