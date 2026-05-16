import { useState, useEffect, useCallback } from 'react';
import { Flex, Text, Badge, Spinner, Button, IconButton } from '@radix-ui/themes';
import {
  CheckCircle2, Circle, Clock, MinusCircle, ExternalLink,
  Package, Plus, ChevronUp, ChevronDown, User, AlertTriangle,
  CalendarClock, UserCog, Wrench, ClipboardList, Target,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { fetchIntervention } from '@/api/interventions';
import { patchInterventionTask } from '@/api/interventionTasks';
import { fetchAuditLogs } from '@/api/auditLogs';
import { STATUS_CONFIG, TYPE_INTER_LABELS } from '@/config/interventionTypes';
import { getInterventionUrgency, formatDueDate } from '@/hooks/useInterventionUrgency';
import TaskCreateForm from '@/components/tasks/TaskCreateForm';
import { useTaskCreate } from '@/hooks/tasks/useTaskCreate';

/* ── Config locale ────────────────────────────────────────────────────────── */

const TASK_STATUS_CFG = {
  todo:        { Icon: Circle,       color: 'var(--gray-7)',   label: 'À faire' },
  in_progress: { Icon: Clock,        color: 'var(--blue-9)',   label: 'En cours' },
  done:        { Icon: CheckCircle2, color: 'var(--green-9)',  label: 'Terminée' },
  skipped:     { Icon: MinusCircle,  color: 'var(--orange-9)', label: 'Ignorée' },
};

const ORIGIN_CFG = {
  plan: { Icon: CalendarClock, color: 'var(--violet-9)', label: 'Préventif' },
  resp: { Icon: UserCog,       color: 'var(--orange-9)', label: 'Responsable' },
  tech: { Icon: Wrench,        color: 'var(--blue-9)',   label: 'Technicien' },
};

const PRIORITY_CFG = {
  urgent:    { color: 'red',    label: 'Urgent' },
  important: { color: 'orange', label: 'Important' },
  normale:   { color: 'gray',   label: 'Normale' },
  normal:    { color: 'gray',   label: 'Normale' },
  faible:    { color: 'gray',   label: 'Faible' },
};

const DECISION_LABELS = {
  status_actual_changed: 'Statut modifié',
  priority_changed:      'Priorité modifiée',
  assigned_to_changed:   'Technicien modifié',
  due_date_changed:      'Échéance modifiée',
  status_changed:        'Statut modifié',
  created:               'Créé',
  deleted:               'Supprimé',
  sort_order_changed:    'Ordre modifié',
};

const STATUS_LEGEND = [
  { key: 'ouvert',          label: 'ouvert',          color: 'var(--blue-9)',   desc: 'Intervention créée, aucune action liée' },
  { key: 'en_cours',        label: 'en_cours',        color: 'var(--green-9)',  desc: 'Au moins une action exécutée, pas de blocage' },
  { key: 'attente_pieces',  label: 'attente_pieces',  color: 'var(--red-9)',    desc: "Action(s) références une DA qui n'est pas reçue" },
  { key: 'attente_prod',    label: 'attente_prod',    color: 'var(--amber-9)',  desc: '(À disparaître) Production en attente' },
  { key: 'ferme',           label: 'fermé',           color: 'var(--green-11)', desc: 'Toutes les tâches terminées, intervention clôturée' },
  { key: 'cancelled',       label: 'annulé',          color: 'var(--gray-9)',   desc: 'Intervention abandonnée, annulée' },
];

/* ── Sous-composants ──────────────────────────────────────────────────────── */

function TaskStatusIcon({ status }) {
  const cfg = TASK_STATUS_CFG[status] ?? TASK_STATUS_CFG.todo;
  return <cfg.Icon size={14} color={cfg.color} style={{ flexShrink: 0 }} />;
}

/* ── Ligne d'audit ────────────────────────────────────────────────────────── */
function AuditLogLine({ log, isHovered, onHover }) {
  const reasonColor = log.reason?.color ?? 'var(--gray-7)';
  const decisionLabel = DECISION_LABELS[log.decision_type] ?? log.decision_type;
  const who = log.changed_by?.initials ?? log.changed_by?.first_name ?? '?';
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
        flexWrap: 'wrap', paddingLeft: 4, paddingRight: 4, paddingTop: 3, paddingBottom: 3,
        borderRadius: 4,
        background: isHovered ? `${reasonColor}18` : 'transparent',
        outline: isHovered ? `1px solid ${reasonColor}55` : '1px solid transparent',
        transition: 'background 0.15s, outline 0.15s',
        cursor: 'default',
      }}>
      {/* Losange — miroir de la frise */}
      <div style={{
        width: 8, height: 8, flexShrink: 0,
        background: reasonColor,
        transform: `rotate(45deg) scale(${isHovered ? 1.2 : 1})`,
        transition: 'transform 0.15s',
        boxShadow: isHovered ? `0 0 0 2px ${reasonColor}55` : 'none',
      }} />
      <Text size="1" style={{ color: 'var(--gray-11)', flexShrink: 0 }}>{decisionLabel}</Text>
      {valueStr && (
        <Text size="1" style={{ color: isHovered ? 'var(--gray-12)' : 'var(--gray-10)', fontFamily: 'monospace', flexShrink: 0, transition: 'color 0.15s' }}>{valueStr}</Text>
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
}

/* ── Mini-frise Gantt par tâche ───────────────────────────────────────────── */
function TaskTimeline({ taskActions, taskAuditLogs, reportedDate, hoveredNum, onHover, hoveredLogId, onHoverLog }) {
  const hasActions = taskActions?.length > 0;
  const hasLogs    = taskAuditLogs?.length > 0;
  if ((!hasActions && !hasLogs) || !reportedDate) return null;

  const refDate = new Date(reportedDate);
  refDate.setHours(0, 0, 0, 0);

  const toDay = (dateStr) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return Math.floor((d - refDate) / 86400000);
  };

  const enrichedActions = (taskActions ?? [])
    .map((a) => ({ ...a, day: toDay(a.date) }))
    .filter((a) => a.day !== null)
    .sort((a, b) => a.day - b.day)
    .map((a, i) => ({ ...a, num: i + 1 }));

  const enrichedLogs = (taskAuditLogs ?? [])
    .map((l) => ({ ...l, day: toDay(l.logged_at) }))
    .filter((l) => l.day !== null)
    .sort((a, b) => a.day - b.day);

  const allDays = [
    ...enrichedActions.map((a) => a.day),
    ...enrichedLogs.map((l) => l.day),
    1,
  ];
  const maxDay = Math.max(...allDays);
  const axisEnd = maxDay + Math.max(Math.ceil(maxDay * 0.12), 2);
  const pct = (day) => `${Math.round((day / axisEnd) * 100)}%`;

  // Hauteur : ligne actions (20px) + ligne axe (1px) + ligne logs (si présents, 18px)
  const totalHeight = hasLogs ? 40 : 20;

  return (
    <div style={{ padding: '8px 14px 6px', borderTop: '1px solid var(--gray-3)' }}>
      <div style={{ position: 'relative', height: totalHeight, marginBottom: 2 }}>

        {/* Ligne de base centrée */}
        <div style={{
          position: 'absolute', top: hasLogs ? 20 : '50%', left: 0, right: 0, height: 1,
          background: (hoveredNum != null || hoveredLogId != null) ? 'var(--gray-6)' : 'var(--gray-4)',
          transition: 'background 0.15s',
        }} />

        {/* J+0 */}
        <div style={{ position: 'absolute', left: 0, top: hasLogs ? 20 : '50%', transform: 'translate(-50%,-50%)', width: 7, height: 7, borderRadius: '50%', background: 'var(--gray-6)', zIndex: 1 }} />
        <Text size="1" style={{ position: 'absolute', left: 5, top: hasLogs ? 13 : '50%', transform: 'translateY(-50%)', fontSize: 8, color: 'var(--gray-8)', fontFamily: 'monospace' }}>J+0</Text>

        {/* Pastilles actions — au-dessus de l'axe */}
        {enrichedActions.map((a) => {
          const color = a.subcategory?.category?.color ?? '#6b7280';
          const isHovered = hoveredNum === a.num;
          const axisTop = hasLogs ? 20 : '50%';
          return (
            <div key={a.id}
              onMouseEnter={() => onHover(a.num)}
              onMouseLeave={() => onHover(null)}
              title={`#${a.num} — J+${a.day} · ${a.subcategory?.code ?? '?'}${a.timeSpent ? ' · ' + a.timeSpent + 'h' : ''}`}
              style={{
                position: 'absolute',
                left: pct(a.day),
                top: typeof axisTop === 'string' ? axisTop : axisTop,
                transform: `translate(-50%, ${hasLogs ? 'calc(-100% - 2px)' : '-50%'}) scale(${isHovered ? 1.35 : 1})`,
                zIndex: isHovered ? 4 : 2,
                width: 16, height: 16, borderRadius: '50%',
                background: color,
                border: `2px solid ${isHovered ? '#fff' : 'var(--color-panel-solid)'}`,
                boxShadow: isHovered ? `0 0 0 2px ${color}` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'default',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}>
              <Text size="1" style={{ fontSize: 8, color: '#fff', fontWeight: 700, lineHeight: 1, fontFamily: 'monospace' }}>{a.num}</Text>
            </div>
          );
        })}

        {/* Losanges audit — en dessous de l'axe */}
        {enrichedLogs.map((l) => {
          const color = l.reason?.color ?? 'var(--gray-7)';
          const isHovered = hoveredLogId === l.id;
          const decisionLabel = DECISION_LABELS[l.decision_type] ?? l.decision_type;
          return (
            <div key={l.id}
              onMouseEnter={() => onHoverLog?.(l.id)}
              onMouseLeave={() => onHoverLog?.(null)}
              title={`J+${l.day} · ${decisionLabel}${l.reason ? ' · ' + l.reason.label : ''}`}
              style={{
                position: 'absolute',
                left: pct(l.day),
                top: 20,
                transform: `translate(-50%, 2px) rotate(45deg) scale(${isHovered ? 1.3 : 1})`,
                zIndex: isHovered ? 4 : 2,
                width: 10, height: 10,
                background: color,
                border: `1.5px solid ${isHovered ? '#fff' : 'var(--color-panel-solid)'}`,
                boxShadow: isHovered ? `0 0 0 2px ${color}` : 'none',
                cursor: 'default',
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// Hook exposant les actions enrichies avec numéro pour la frise et la liste
function useEnrichedActions(taskActions, reportedDate) {
  const refDate = reportedDate ? new Date(reportedDate) : null;
  if (refDate) refDate.setHours(0, 0, 0, 0);

  const toDay = (dateStr) => {
    if (!refDate || !dateStr) return null;
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    return Math.floor((d - refDate) / 86400000);
  };

  return [...taskActions]
    .map((a) => ({ ...a, day: toDay(a.date) }))
    .sort((a, b) => (a.day ?? 9999) - (b.day ?? 9999))
    .map((a, i) => ({ ...a, num: i + 1 }));
}

function TaskCard({ task, isCritical, actions, reportedDate, auditLogs, editCell, onStartEdit, onSaveField, onCancelEdit, onMoveUp, onMoveDown, isFirst, isLast, users, editSaving }) {
  const cfg = TASK_STATUS_CFG[task.status] ?? TASK_STATUS_CFG.todo;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const overdue = task.due_date && new Date(task.due_date) < today;
  const dueFmt = task.due_date
    ? new Date(task.due_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : null;
  const assignedTo = task.assigned_to ?? null;
  const initials = assignedTo
    ? (assignedTo.initial ?? `${assignedTo.first_name?.[0] ?? ''}${assignedTo.last_name?.[0] ?? ''}`).toUpperCase()
    : null;

  const editingDue = editCell?.taskId === task.id && editCell?.field === 'due_date';
  const editingAssign = editCell?.taskId === task.id && editCell?.field === 'assigned_to';
  const isDone = task.status === 'done' || task.status === 'skipped';

  const [hoveredNum, setHoveredNum] = useState(null);
  const [hoveredLogId, setHoveredLogId] = useState(null);

  const taskAuditLogs = (auditLogs ?? [])
    .filter((l) => String(l.entity_id) === String(task.id))
    .filter((l) => !l.is_system || l.decision_type !== 'sort_order_changed')
    .sort((a, b) => new Date(a.logged_at) - new Date(b.logged_at));

  const rawTaskActions = actions?.filter((a) => {
    const taskId = a.task?.id ?? null;
    return taskId !== null && String(taskId) === String(task.id);
  }) ?? [];
  const taskActions = useEnrichedActions(rawTaskActions, reportedDate);

  return (
    <div style={{
      border: '1px solid var(--gray-4)',
      borderLeft: `3px solid ${isCritical ? 'var(--accent-8)' : cfg.color}`,
      borderRadius: 8,
      overflow: 'hidden',
      background: isDone ? 'var(--gray-1)' : isCritical ? 'var(--accent-1)' : 'var(--color-panel-solid)',
      opacity: editSaving === task.id ? 0.6 : 1,
      transition: 'opacity 0.15s',
    }}>
      {/* ── En-tête tâche ── */}
      <Flex align="center" gap="2" style={{ padding: '10px 12px', borderBottom: taskActions.length > 0 ? '1px solid var(--gray-3)' : 'none' }}>
        {/* Réordonnancement */}
        <Flex direction="column" gap="0" style={{ flexShrink: 0 }}>
          <IconButton size="1" variant="ghost" color="gray" disabled={isFirst}
            onClick={(e) => { e.stopPropagation(); onMoveUp?.(); }}>
            <ChevronUp size={10} />
          </IconButton>
          <IconButton size="1" variant="ghost" color="gray" disabled={isLast}
            onClick={(e) => { e.stopPropagation(); onMoveDown?.(); }}>
            <ChevronDown size={10} />
          </IconButton>
        </Flex>

        <TaskStatusIcon status={task.status} />

        {/* Titre + numéro */}
        <Flex direction="column" gap="0" style={{ flex: 1, minWidth: 0 }}>
          <Flex align="center" gap="2">
            <Text size="1" color="gray" style={{ fontFamily: 'monospace', flexShrink: 0 }}>
              #{task.sort_order ?? '—'}
            </Text>
            <Text size="2" weight={task.status === 'in_progress' ? 'bold' : 'medium'}
              style={{ color: 'var(--gray-12)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: isDone ? 0.6 : 1 }}>
              {task.label}
            </Text>
            {task.optional && <Badge size="1" variant="soft" color="gray" style={{ flexShrink: 0 }}>opt.</Badge>}
            {task.status === 'skipped' && task.skip_reason && (
              <Text size="1" color="orange" style={{ fontStyle: 'italic', flexShrink: 0 }}>{task.skip_reason}</Text>
            )}
          </Flex>

          {/* Origine */}
          {task.origin && ORIGIN_CFG[task.origin] && (() => {
            const oc = ORIGIN_CFG[task.origin];
            return (
              <Flex align="center" gap="1" mt="1">
                <oc.Icon size={11} color={oc.color} />
                <Text size="1" style={{ color: oc.color }}>{oc.label}</Text>
                <Badge size="1" color={task.gamme_step_id ? 'green' : 'gray'} variant="soft">
                  {task.gamme_step_id ? 'Gamme' : 'Manuelle'}
                </Badge>
              </Flex>
            );
          })()}
        </Flex>

        {/* Assigné */}
        {editingAssign ? (
          <select
            autoFocus // eslint-disable-line jsx-a11y/no-autofocus
            defaultValue={String(assignedTo?.id ?? '')}
            onChange={(e) => onSaveField(task.id, 'assigned_to', e.target.value || null)}
            onBlur={(e) => { if (e.target.value === String(assignedTo?.id ?? '')) onCancelEdit(); }}
            onKeyDown={(e) => { if (e.key === 'Escape') onCancelEdit(); }}
            onClick={(e) => e.stopPropagation()}
            style={{ fontSize: 11, padding: '1px 4px', borderRadius: 4, border: '1px solid var(--accent-8)', background: 'var(--color-background)', color: 'var(--gray-12)', outline: 'none', maxWidth: 130 }}
          >
            <option value="">— Non assigné</option>
            {(users ?? []).map((u) => (
              <option key={u.id} value={String(u.id)}>
                {`${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email || String(u.id)}
              </option>
            ))}
          </select>
        ) : (
          <button
            type="button"
            title={initials ? 'Modifier l\'assigné' : 'Assigner'}
            onClick={(e) => { e.stopPropagation(); onStartEdit(task.id, 'assigned_to'); }}
            style={{
              background: initials ? 'var(--accent-4)' : 'var(--gray-3)',
              border: '1px solid',
              borderColor: initials ? 'var(--accent-6)' : 'var(--gray-5)',
              borderRadius: '50%',
              width: 26, height: 26,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', padding: 0, flexShrink: 0,
            }}
          >
            {initials
              ? <Text size="1" weight="bold" style={{ color: 'var(--accent-11)', fontSize: 9, lineHeight: 1 }}>{initials}</Text>
              : <User size={12} color="var(--gray-9)" />
            }
          </button>
        )}

        {/* Échéance */}
        {editingDue ? (
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
              if (e.key === 'Enter') e.target.blur();
              if (e.key === 'Escape') onCancelEdit();
            }}
            onClick={(e) => e.stopPropagation()}
            style={{ fontSize: 11, padding: '1px 4px', borderRadius: 4, border: '1px solid var(--accent-8)', background: 'var(--color-background)', color: 'var(--gray-12)', outline: 'none', width: 110 }}
          />
        ) : (
          <button
            type="button"
            title="Modifier l'échéance"
            onClick={(e) => { e.stopPropagation(); onStartEdit(task.id, 'due_date'); }}
            style={{ background: 'none', border: 'none', padding: '1px 3px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}
          >
            {overdue && dueFmt
              ? <Badge color="red" variant="solid" size="1" style={{ display: 'flex', alignItems: 'center', gap: 3, pointerEvents: 'none' }}><AlertTriangle size={10} />{dueFmt}</Badge>
              : dueFmt
                ? <Text size="1" color="gray">{dueFmt}</Text>
                : <Text size="1" style={{ color: 'var(--gray-5)' }}>+ date</Text>
            }
          </button>
        )}

        {/* Temps passé */}
        {task.action_count > 0 && (
          <Flex align="center" gap="1" style={{ flexShrink: 0 }}>
            <Clock size={11} color="var(--gray-8)" />
            <Text size="1" color="gray">{task.action_count} · {task.time_spent}h</Text>
          </Flex>
        )}
      </Flex>

      {/* ── Frise Gantt : actions + audit logs ── */}
      {(taskActions.length > 0 || taskAuditLogs.length > 0) && (
        <TaskTimeline
          taskActions={taskActions}
          taskAuditLogs={taskAuditLogs}
          reportedDate={reportedDate}
          hoveredNum={hoveredNum}
          onHover={setHoveredNum}
          hoveredLogId={hoveredLogId}
          onHoverLog={setHoveredLogId}
        />
      )}

      {/* ── Actions liées à la tâche ── */}
      {taskActions.length > 0 && (
        <div style={{ padding: '4px 12px 6px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Text size="1" color="gray" weight="medium" style={{ marginBottom: 2 }}>Actions :</Text>
          {taskActions.map((a) => (
            <ActionSummaryLine
              key={a.id}
              action={a}
              isHovered={hoveredNum === a.num}
              onHover={setHoveredNum}
            />
          ))}
        </div>
      )}

      {/* ── Historique de la tâche (audit logs) ── */}
      {taskAuditLogs.length > 0 && (
        <div style={{ padding: '4px 12px 8px', borderTop: taskActions.length > 0 ? '1px solid var(--gray-3)' : 'none', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Text size="1" color="gray" weight="medium" style={{ marginBottom: 2 }}>Historique :</Text>
          {taskAuditLogs.map((log, i) => (
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
}

/* ── Ligne résumée d'une action (style visuel de l'image) ─────────────────── */
function ActionSummaryLine({ action, isHovered, onHover }) {
  const subcatCode = action.subcategory?.code ?? action.subcategory?.label ?? '—';
  const subcatColor = action.subcategory?.category?.color ?? '#6b7280';
  const dateStr = action.date
    ? new Date(action.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric' })
    : null;
  const duration = action.timeSpent ?? null;
  const tech = action.technician;
  const techInitials = tech?.initial
    ?? (tech ? `${tech.firstName?.[0] ?? ''}${tech.lastName?.[0] ?? ''}`.toUpperCase() || null : null);
  const daRefs = (action.purchaseRequests ?? [])
    .map((pr) => pr.code ?? pr.reference ?? pr.da_number)
    .filter(Boolean);

  return (
    <Flex align="center" gap="2" style={{
      flexWrap: 'wrap', paddingLeft: 2, paddingRight: 4,
      paddingTop: 3, paddingBottom: 3, borderRadius: 4,
      background: isHovered ? `${subcatColor}18` : 'transparent',
      outline: isHovered ? `1px solid ${subcatColor}55` : '1px solid transparent',
      transition: 'background 0.15s, outline 0.15s',
      cursor: 'default',
    }}
      onMouseEnter={() => onHover(action.num)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Pastille numérotée — miroir de la frise */}
      {action.num != null && (
        <div style={{
          width: 14, height: 14, borderRadius: '50%',
          background: subcatColor,
          transform: isHovered ? 'scale(1.2)' : 'scale(1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          transition: 'transform 0.15s',
          boxShadow: isHovered ? `0 0 0 2px ${subcatColor}55` : 'none',
        }}>
          <Text size="1" style={{ fontSize: 8, color: '#fff', fontWeight: 700, lineHeight: 1, fontFamily: 'monospace' }}>{action.num}</Text>
        </div>
      )}
      <Text size="1" style={{ color: subcatColor, fontFamily: 'monospace', fontWeight: 700, flexShrink: 0 }}>
        {subcatCode}
      </Text>
      {dateStr && <Text size="1" color="gray" style={{ flexShrink: 0 }}>({dateStr}{duration != null ? `, ${duration}h` : ''})</Text>}
      {techInitials && <Text size="1" weight="medium" style={{ color: 'var(--gray-11)', flexShrink: 0 }}>{techInitials}</Text>}
      {action.description && (
        <Text size="1" style={{ color: isHovered ? 'var(--gray-12)' : 'var(--gray-9)', fontStyle: 'italic', minWidth: 0, transition: 'color 0.15s' }}>
          {action.description}
        </Text>
      )}
      {daRefs.map((ref) => (
        <Badge key={ref} size="1" variant="soft" color="orange" style={{ fontFamily: 'monospace', flexShrink: 0 }}>[{ref}]</Badge>
      ))}
    </Flex>
  );
}

/* ── Frise des statuts ────────────────────────────────────────────────────── */
function StatusTimeline({ statusHistory, reportedDate }) {
  if (!statusHistory?.length && !reportedDate) return null;

  const openDate = reportedDate ? new Date(reportedDate) : null;
  const refDate = openDate ?? new Date();

  const getDaysLabel = (dateStr) => {
    if (!openDate || !dateStr) return null;
    const d = Math.floor((new Date(dateStr) - openDate) / 86400000);
    return `J+${d}`;
  };

  return (
    <div style={{ padding: '10px 14px', borderTop: '1px solid var(--gray-4)' }}>
      <Flex align="center" gap="2" mb="2">
        <Clock size={13} color="var(--gray-9)" />
        <Text size="2" weight="bold" color="gray">Changements de statut de l'intervention</Text>
      </Flex>

      {/* Étiquettes statuts au-dessus */}
      {statusHistory?.length > 0 && (
        <>
          <Flex gap="2" mb="1" style={{ flexWrap: 'wrap' }}>
            {statusHistory.map((entry, i) => {
              const cfg = STATUS_CONFIG[entry.status];
              if (!cfg) return null;
              const daysLabel = getDaysLabel(entry.date);
              return (
                <Flex key={i} direction="column" align="center" gap="0" style={{ minWidth: 60 }}>
                  {daysLabel && <Text size="1" color="gray" style={{ fontFamily: 'monospace' }}>{daysLabel}</Text>}
                  <Badge size="1" color={cfg.color} variant="soft">{cfg.label}</Badge>
                </Flex>
              );
            })}
          </Flex>

          {/* Barre de progression */}
          <div style={{ height: 28, borderRadius: 6, overflow: 'hidden', display: 'flex', background: 'var(--gray-3)' }}>
            {statusHistory.map((entry, i) => {
              const cfg = STATUS_CONFIG[entry.status];
              const COLOR_MAP = {
                blue: 'var(--blue-7)', green: 'var(--green-7)', red: 'var(--red-7)',
                amber: 'var(--amber-7)', gray: 'var(--gray-6)',
              };
              const bg = COLOR_MAP[cfg?.color] ?? 'var(--gray-5)';
              const nextDate = statusHistory[i + 1]?.date ? new Date(statusHistory[i + 1].date) : new Date();
              const startDate = entry.date ? new Date(entry.date) : refDate;
              const span = Math.max(nextDate - startDate, 1);
              const total = Math.max(new Date() - refDate, 1);
              const pct = Math.round((span / total) * 100);
              const daysLabel = getDaysLabel(entry.date);
              return (
                <div key={i} title={cfg?.label ?? entry.status}
                  style={{ flex: pct, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 30 }}>
                  {daysLabel && (
                    <Text size="1" style={{ color: '#fff', fontFamily: 'monospace', fontSize: 10, opacity: 0.9 }}>
                      {daysLabel} {cfg?.label ?? entry.status}
                    </Text>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Légende des statuts ──────────────────────────────────────────────────── */
function StatusLegend() {
  return (
    <div style={{ padding: '10px 14px', borderTop: '1px solid var(--gray-4)' }}>
      <Flex align="center" gap="2" mb="2">
        <ClipboardList size={13} color="var(--gray-9)" />
        <Text size="2" weight="bold" color="gray">Les {STATUS_LEGEND.length - 1} statuts</Text>
      </Flex>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 6 }}>
        {STATUS_LEGEND.map(({ key, label, color, desc }) => (
          <div key={key} style={{
            border: `1px solid ${color}44`,
            borderLeft: `3px solid ${color}`,
            borderRadius: 6,
            padding: '6px 10px',
            background: `${color}0d`,
          }}>
            <Text size="1" weight="bold" style={{ color, display: 'block', fontFamily: 'monospace' }}>{label}</Text>
            <Text size="1" color="gray">{desc}</Text>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Empty state ──────────────────────────────────────────────────────────── */
function EmptyState() {
  return (
    <Flex align="center" justify="center" direction="column" gap="3"
      style={{ height: '100%', minHeight: 300, color: 'var(--gray-8)' }}>
      <ClipboardList size={32} strokeWidth={1.5} />
      <Text size="2" color="gray">Sélectionne une intervention</Text>
    </Flex>
  );
}

/* ── Composant principal ──────────────────────────────────────────────────── */

export function InterventionDetailView({ situation, onRefresh }) {
  const [detail, setDetail]     = useState(null);
  const [tasks, setTasks]       = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editCell, setEditCell] = useState(null);
  const [editSaving, setEditSaving] = useState(null);
  const [showLegend, setShowLegend] = useState(false);

  const loadDetail = useCallback((id) => {
    setDetail(null);
    setTasks([]);
    setAuditLogs([]);
    setLoading(true);
    setShowForm(false);
    fetchIntervention(id)
      .then((iv) => {
        setDetail(iv);
        setTasks(Array.isArray(iv.tasks) ? iv.tasks : []);
        // Charge les logs d'audit pour l'intervention et ses tâches
        const taskIds = Array.isArray(iv.tasks) ? iv.tasks.map((t) => String(t.id)) : [];
        const fromDt = iv.reportedDate ? new Date(iv.reportedDate).toISOString() : undefined;
        const fetches = [
          fetchAuditLogs({ entity_id: id, entity_type: 'intervention', limit: 200 }),
          ...taskIds.map((tid) => fetchAuditLogs({ entity_id: tid, entity_type: 'task', limit: 100, ...(fromDt ? { from_dt: fromDt } : {}) })),
        ];
        Promise.allSettled(fetches).then((results) => {
          const all = results
            .filter((r) => r.status === 'fulfilled')
            .flatMap((r) => r.value.items ?? []);
          setAuditLogs(all);
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (situation?.id) loadDetail(situation.id);
  }, [situation?.id, loadDetail]);

  const startEdit  = useCallback((taskId, field) => setEditCell({ taskId, field }), []);
  const cancelEdit = useCallback(() => setEditCell(null), []);

  const saveField = useCallback(async (taskId, field, value) => {
    setEditCell(null);
    setEditSaving(taskId);
    try {
      await patchInterventionTask(taskId, { [field]: value || null });
      if (situation?.id) loadDetail(situation.id);
    } catch {
      if (situation?.id) loadDetail(situation.id);
    } finally {
      setEditSaving(null);
    }
  }, [situation?.id, loadDetail]);

  const taskCreate = useTaskCreate({
    interventionId: situation ? String(situation.id) : null,
    onSuccess: () => {
      setShowForm(false);
      if (situation?.id) loadDetail(situation.id);
      onRefresh?.();
    },
  });

  if (!situation) return <EmptyState />;

  /* ── Calculs ── */
  const statusCfg   = STATUS_CONFIG[detail?.status ?? situation.status_actual] ?? STATUS_CONFIG[situation.status_actual];
  const priorityCfg = PRIORITY_CFG[situation.priority] ?? PRIORITY_CFG.normale;
  const typeLabel   = TYPE_INTER_LABELS[situation.type] ?? situation.type ?? '—';

  const totalTime    = detail?.stats?.totalTime ?? situation.stats?.totalTime ?? 0;
  const actionCount  = detail?.stats?.actionCount ?? detail?.action?.length ?? situation.stats?.actionCount ?? 0;
  const purchaseCount = detail?.stats?.purchasePending ?? situation.stats?.purchasePending ?? situation.stats?.purchaseCount ?? 0;
  const daysOpen     = situation.daysOpen ?? 0;

  const urgency = getInterventionUrgency(situation.next_due_date, situation.reportedDate);

  const sortedTasks = [...tasks].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const criticalTask = sortedTasks.find((t) => t.status !== 'done' && t.status !== 'skipped' && t.due_date)
    ?? sortedTasks.find((t) => t.status === 'in_progress')
    ?? sortedTasks[0];

  const handleMove = async (task, idx, direction) => {
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= sortedTasks.length) return;
    const swapTask = sortedTasks[swapIdx];
    const newOrder = swapTask.sort_order ?? swapIdx;
    const taskOrder = task.sort_order ?? idx;
    setTasks((prev) => prev.map((t) => {
      if (t.id === task.id) return { ...t, sort_order: newOrder };
      if (t.id === swapTask.id) return { ...t, sort_order: taskOrder };
      return t;
    }));
    await Promise.all([
      patchInterventionTask(task.id, { sort_order: newOrder }),
      patchInterventionTask(swapTask.id, { sort_order: taskOrder }),
    ]).catch(() => loadDetail(situation.id));
  };

  const openFmt  = situation.reportedDate
    ? new Date(situation.reportedDate).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : null;
  const closeFmt = detail?.closedAt ?? detail?.closed_at
    ? new Date(detail.closedAt ?? detail.closed_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit' })
    : null;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* ════════════════════ HEADER ════════════════════ */}
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--gray-4)', flexShrink: 0 }}>

        {/* Ligne 1 : code + statut + priorité + type + lien */}
        <Flex align="center" gap="2" mb="2" wrap="wrap">
          <Link to={`/intervention/${situation.id}`} style={{ textDecoration: 'none', flexShrink: 0 }}>
            <Badge variant="outline" color="gray" size="2"
              style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>
              {situation.code}
            </Badge>
          </Link>
          {statusCfg && <Badge size="1" color={statusCfg.color} variant="soft">{statusCfg.label}</Badge>}
          <Badge size="1" color={priorityCfg.color} variant="soft">{priorityCfg.label}</Badge>
          <Badge size="1" color="gray" variant="soft">{typeLabel}</Badge>
          <Link to={`/intervention/${situation.id}`} style={{ marginLeft: 'auto', flexShrink: 0 }}>
            <Button size="1" variant="ghost" color="gray"><ExternalLink size={13} /></Button>
          </Link>
        </Flex>

        {/* Titre */}
        <Text size="3" weight="bold" style={{ display: 'block', color: 'var(--gray-12)', marginBottom: 2 }}>
          {situation.title}
        </Text>

        {/* Machine + dates */}
        <Flex align="center" gap="3" wrap="wrap">
          {situation.machine && (
            <Text size="2" color="gray" style={{ fontStyle: 'italic' }}>
              {situation.machine.code} — {situation.machine.name}
            </Text>
          )}
          {openFmt && (
            <Text size="1" color="gray">
              Ouvert {openFmt}
              {closeFmt ? ` • Fermé ${closeFmt}` : ` • ${daysOpen}j`}
            </Text>
          )}
        </Flex>

        {/* DI liée */}
        {detail?.request && (
          <Flex align="center" gap="2" mt="2"
            style={{ padding: '5px 8px', background: 'var(--gray-2)', borderRadius: 4 }}>
            <ClipboardList size={12} color="var(--gray-9)" style={{ flexShrink: 0 }} />
            <Text size="1" color="gray">
              <strong>{detail.request.code}</strong>
              {detail.request.demandeurNom ? ` · ${detail.request.demandeurNom}` : ''}
              {detail.request.description ? ` — ${detail.request.description}` : ''}
            </Text>
          </Flex>
        )}

        {/* Métriques */}
        <Flex align="center" gap="3" mt="2" style={{ flexWrap: 'wrap' }}>
          <Flex align="center" gap="1">
            <Clock size={12} color="var(--gray-9)" />
            <Text size="1" color="gray">
              <strong>{actionCount}</strong> action{actionCount !== 1 ? 's' : ''} · <strong>{totalTime}h</strong>
            </Text>
          </Flex>
          {purchaseCount > 0 && (
            <Flex align="center" gap="1">
              <Package size={12} color="var(--orange-9)" />
              <Text size="1" style={{ color: 'var(--orange-11)' }}>
                <strong>{purchaseCount}</strong> DA en attente
              </Text>
            </Flex>
          )}
          {situation.techInitials && (
            <Badge size="1" variant="soft" color="gray" style={{ fontFamily: 'monospace' }}>
              {situation.techInitials}
            </Badge>
          )}
        </Flex>

        {/* Badge urgence */}
        {situation.next_due_date && (
          <Flex align="center" gap="2" mt="2" style={{
            padding: '6px 10px',
            background: urgency.level === 'overdue' ? 'var(--red-2)' : urgency.level === 'urgent' ? 'var(--orange-2)' : 'var(--blue-2)',
            borderRadius: 6,
            borderLeft: `3px solid ${urgency.color}`,
          }}>
            <Target size={13} style={{ color: urgency.color, flexShrink: 0 }} />
            <Flex direction="column" gap="0" style={{ flex: 1, minWidth: 0 }}>
              {criticalTask && (
                <Text size="1" weight="bold" style={{ color: 'var(--gray-12)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {criticalTask.label}
                </Text>
              )}
              <Text size="1" weight="medium" style={{ color: urgency.color }}>
                Due : {formatDueDate(situation.next_due_date)}
                {urgency.level === 'overdue' && ' — EN RETARD'}
              </Text>
            </Flex>
          </Flex>
        )}
      </div>

      {/* ════════════════════ BODY ════════════════════ */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

        {loading && <Flex justify="center" pt="4"><Spinner size="2" /></Flex>}

        {/* ── Tâches ── */}
        {!loading && (
          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sortedTasks.length === 0 && (
              <Text size="2" color="gray" style={{ fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
                Aucune tâche liée à cette intervention
              </Text>
            )}

            {sortedTasks.map((task, idx) => (
              <TaskCard
                key={task.id}
                task={task}
                isCritical={criticalTask?.id === task.id}
                actions={detail?.action ?? []}
                reportedDate={situation.reportedDate}
                auditLogs={auditLogs}
                editCell={editCell}
                onStartEdit={startEdit}
                onSaveField={saveField}
                onCancelEdit={cancelEdit}
                onMoveUp={() => handleMove(task, idx, -1)}
                onMoveDown={() => handleMove(task, idx, 1)}
                isFirst={idx === 0}
                isLast={idx === sortedTasks.length - 1}
                users={taskCreate.users}
                editSaving={editSaving}
              />
            ))}

            {/* Actions sans tâche associée */}
            {detail?.action?.filter((a) => {
              const taskId = a.task?.id ?? null;
              return !taskId || !sortedTasks.some((t) => String(t.id) === String(taskId));
            }).length > 0 && (
              <div style={{ border: '1px solid var(--gray-4)', borderRadius: 8, overflow: 'hidden', background: 'var(--color-panel-solid)' }}>
                <Flex align="center" gap="2" style={{ padding: '8px 12px', borderBottom: '1px solid var(--gray-3)' }}>
                  <Clock size={13} color="var(--gray-9)" />
                  <Text size="2" weight="medium" color="gray">Actions non liées à une tâche</Text>
                </Flex>
                <div style={{ padding: '6px 12px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {detail.action
                    .filter((a) => {
                      const taskId = a.task?.id ?? null;
                      return !taskId || !sortedTasks.some((t) => String(t.id) === String(taskId));
                    })
                    .map((a) => <ActionSummaryLine key={a.id} action={a} />)}
                </div>
              </div>
            )}

            {/* Ajouter tâche */}
            {showForm ? (
              <TaskCreateForm
                formData={taskCreate.formData}
                set={taskCreate.set}
                users={taskCreate.users}
                saving={taskCreate.saving}
                errors={taskCreate.errors}
                onSubmit={taskCreate.handleSubmit}
                onCancel={() => { taskCreate.reset(); setShowForm(false); }}
                interventionId={String(situation.id)}
                interventionLabel={`${situation.code} — ${situation.title}`}
                embedded
                size="2"
              />
            ) : (
              <Button size="1" variant="soft" color="blue" onClick={() => setShowForm(true)}
                style={{ alignSelf: 'flex-start' }}>
                <Plus size={13} /> Ajouter une tâche
              </Button>
            )}
          </div>
        )}

        {/* ── Frise statuts ── */}
        {detail?.statusLogs?.length > 0 && (
          <StatusTimeline
            statusHistory={[...detail.statusLogs]
              .sort((a, b) => new Date(a.date) - new Date(b.date))
              .map((log) => ({
                status: log.status_to_detail?.id,
                date: log.date,
              }))}
            reportedDate={situation.reportedDate}
          />
        )}

        {/* ── Audit logs intervention ── */}
        {(() => {
          const ivAuditLogs = auditLogs
            .filter((l) => String(l.entity_type) === 'intervention' && String(l.entity_id) === String(situation.id))
            .filter((l) => l.decision_type !== 'status_actual_changed') // déjà dans la frise statuts
            .sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));
          if (ivAuditLogs.length === 0) return null;
          return (
            <div style={{ padding: '6px 14px 10px', borderTop: '1px solid var(--gray-4)' }}>
              <Text size="1" weight="medium" color="gray" style={{ display: 'block', marginBottom: 4 }}>
                Modifications de l'intervention
              </Text>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {ivAuditLogs.map((log, i) => <AuditLogLine key={log.id ?? i} log={log} />)}
              </div>
            </div>
          );
        })()}

        {/* ── Légende statuts (toggle) ── */}
        <div style={{ padding: '8px 14px', borderTop: '1px solid var(--gray-4)', marginTop: 'auto' }}>
          <button
            type="button"
            onClick={() => setShowLegend((v) => !v)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}
          >
            <ClipboardList size={13} color="var(--gray-8)" />
            <Text size="1" color="gray">{showLegend ? 'Masquer' : 'Voir'} la légende des statuts</Text>
          </button>
        </div>
        {showLegend && <StatusLegend />}
      </div>
    </div>
  );
}
