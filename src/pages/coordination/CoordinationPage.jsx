import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Badge, Button, Flex, Select, Spinner, Tabs, Text } from '@radix-ui/themes';
import { ChevronLeft, ChevronRight, MousePointerClick, CalendarDays, CalendarX2 } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { fetchInterventionTasksList, patchInterventionTask } from '@/api/interventionTasks';
import { fetchInterventions, updateIntervention } from '@/api/interventions';
import { fetchEquipements } from '@/api/equipements';
import { fetchInterventionRequests } from '@/api/intervention-requests';
import { INTERVENTION_TYPES, STATUS_CONFIG, PRIORITY_CONFIG } from '@/config/interventionTypes';
import { GroupCard } from '@/components/shared/GroupCard';
import GhostCreateRow, { useUsers } from '@/components/tasks/GhostCreateRow';
import TaskActionButtons from '@/components/tasks/TaskActionButtons';
import {
  getMondayOf,
  addDays,
  todayIso,
  getWeekDays,
} from '@/components/planning/planningUtils';

// ── Date helpers ─────────────────────────────────────────────────────────────

function getISOWeekString(monday) {
  const d = new Date(monday);
  d.setHours(0, 0, 0, 0);
  const jan4 = new Date(d.getFullYear(), 0, 4);
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const weekNum = Math.round((d - startOfWeek1) / (7 * 86400000)) + 1;
  const year = weekNum >= 52 && d.getMonth() === 0 ? d.getFullYear() - 1
    : weekNum === 1 && d.getMonth() === 11 ? d.getFullYear() + 1
    : d.getFullYear();
  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

function mondayFromISOWeek(weekStr) {
  const m = weekStr.match(/^(\d{4})-W(\d{2})$/);
  if (!m) return getMondayOf(todayIso());
  const [, year, week] = m;
  const jan4 = new Date(Number(year), 0, 4);
  const startOfWeek1 = new Date(jan4);
  startOfWeek1.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
  const d = new Date(startOfWeek1);
  d.setDate(d.getDate() + (Number(week) - 1) * 7);
  return d.toISOString().slice(0, 10);
}

function formatSubtitle(monday, friday) {
  const from = new Date(monday).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  const to   = new Date(friday).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  return `Planning de la semaine · ${from} – ${to}`;
}

function getDaysOpen(dateStr) {
  if (!dateStr) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000));
}

// ── Health config ─────────────────────────────────────────────────────────────

const HEALTH_ORDER = { critical: 0, warning: 1, maintenance: 2, ok: 3 };

// ── Task row (une ligne par tâche) ───────────────────────────────────────────


const TYPE_BORDER_COLOR = {
  PRE: 'var(--green-9)',
  CUR: 'var(--red-9)',
  PRO: 'var(--violet-9)',
};

function TaskRow({ task }) {
  const iv          = task._intervention ?? {};
  const initials    = (task._initials || (task.assigned_to_initials ?? task.tech_initials ?? '')).toUpperCase();
  const ivTitle     = iv.title ?? null;
  const eqCode      = iv.equipement?.code ?? null;

  const code        = iv.code ?? '';
  const typeKey     = code.includes('-PRE-') ? 'PRE' : code.includes('-CUR-') ? 'CUR' : code.includes('-PRO-') ? 'PRO' : '';
  const borderColor = TYPE_BORDER_COLOR[typeKey] ?? 'var(--gray-6)';

  return (
    <Flex
      align="stretch"
      style={{
        border: '1px solid var(--gray-3)',
        borderLeft: `2px solid ${borderColor}`,
        borderRadius: 4,
        background: 'var(--color-panel-solid)',
        marginBottom: 4,
        minWidth: 0,
        overflow: 'hidden',
      }}
    >
      {/* Code machine — colonne gauche, centré verticalement */}
      {eqCode && (
        <Flex align="center" justify="center" style={{
          padding: '2px 5px',
          borderRight: '1px solid var(--gray-3)',
          background: 'var(--gray-2)',
          flexShrink: 0,
        }}>
          <Text style={{ fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: 'var(--gray-11)', writingMode: 'horizontal-tb' }}>
            {eqCode}
          </Text>
        </Flex>
      )}

      {/* Contenu : 2 lignes */}
      <div style={{ flex: 1, minWidth: 0, padding: '4px 6px' }}>
        {/* Ligne 1 : initiales tech + libellé tâche */}
        <Flex align="center" gap="1" style={{ minWidth: 0 }}>
          {initials && (
            <span style={{
              fontFamily: 'monospace', fontWeight: 700, fontSize: 10,
              color: 'var(--blue-11)', background: 'var(--blue-3)',
              borderRadius: 3, padding: '0 3px', flexShrink: 0, lineHeight: '16px',
            }}>
              {initials}
            </span>
          )}
          <Text size="1" style={{
            flex: 1, overflow: 'hidden',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            color: 'var(--gray-12)', fontWeight: task.status === 'in_progress' ? 600 : 400,
            fontSize: 12, lineHeight: '1.3',
          }}>
            {task.label ?? '—'}
          </Text>
        </Flex>

        {/* Ligne 2 : titre DA */}
        {ivTitle && (
          <Text style={{ fontSize: 10, color: 'var(--gray-8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
            {ivTitle}
          </Text>
        )}
      </div>
    </Flex>
  );
}

// ── Day column ────────────────────────────────────────────────────────────────

const MAX_VISIBLE = 6;

function TaskDayColumn({ dateStr, tasks, isToday }) {
  const dayTasks = tasks.filter((t) => t.due_date === dateStr);
  const visible = dayTasks.slice(0, MAX_VISIBLE);
  const overflow = dayTasks.length - MAX_VISIBLE;

  const dayLabel = new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' });

  return (
    <div
      style={{
        borderRight: '1px solid var(--gray-4)',
        padding: '0 12px 8px',
        minWidth: 0,
      }}
    >
      {/* En-tête : jour + compteur */}
      <Flex align="baseline" justify="between" style={{ marginBottom: 10 }}>
        <Text
          size="3"
          weight="bold"
          style={{
            textTransform: 'capitalize',
            color: isToday ? 'var(--blue-11)' : 'var(--gray-12)',
            borderBottom: isToday ? '2px solid var(--blue-8)' : '2px solid transparent',
            paddingBottom: 2,
          }}
        >
          {dayLabel}
        </Text>
        {dayTasks.length > 0 && (
          <Text size="1" style={{ color: 'var(--gray-9)', fontWeight: 600 }}>
            {dayTasks.length}
          </Text>
        )}
      </Flex>

      {/* Tâches */}
      {dayTasks.length === 0 ? (
        <Flex direction="column" align="center" gap="1" style={{ padding: '16px 0', opacity: 0.4 }}>
          <CalendarX2 size={22} color="var(--gray-9)" strokeWidth={1.5} />
          <Text size="1" color="gray">Aucune tâche</Text>
        </Flex>
      ) : (
        <>
          {visible.map((t) => <TaskRow key={t.id} task={t} />)}
          {overflow > 0 && (
            <Text size="1" style={{ color: 'var(--blue-10)', marginTop: 6, display: 'block' }}>
              +{overflow} autre{overflow > 1 ? 's' : ''}
            </Text>
          )}
        </>
      )}
    </div>
  );
}

// ── Week planning ─────────────────────────────────────────────────────────────

function WeekPlanning({ monday, tasks, loading }) {
  const today = todayIso();
  const weekDays = getWeekDays(monday).slice(0, 5);

  if (loading) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: 160 }}>
        <Spinner size="2" />
      </Flex>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
      {weekDays.map((d) => (
        <TaskDayColumn key={d} dateStr={d} tasks={tasks} isToday={d === today} />
      ))}
    </div>
  );
}

// ── Equipements panel ─────────────────────────────────────────────────────────

const HEALTH_BAR_COLOR = {
  critical:    'var(--red-9)',
  warning:     'var(--yellow-9)',
  maintenance: 'var(--orange-9)',
  ok:          'var(--green-8)',
};

function EquipementLine({ eq, isSelected, onSelect, isLast }) {
  const health = eq.health?.level ?? 'ok';
  const interCount = eq._interventionCount ?? 0;
  const diCount = eq._diCount ?? 0;
  const barColor = HEALTH_BAR_COLOR[health] ?? 'var(--gray-6)';

  return (
    <GroupCard.Row
      accentColor={isSelected ? 'var(--blue-9)' : barColor}
      isLast={isLast}
      background={isSelected ? 'var(--blue-2)' : undefined}
      onClick={() => onSelect(eq.id === isSelected ? null : eq.id)}
    >
      <Text size="1" style={{ fontFamily: 'monospace', color: 'var(--gray-9)', flexShrink: 0, fontWeight: 600 }}>
        {eq.code ?? '—'}
      </Text>
      <Text size="1" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--gray-12)', fontStyle: 'italic' }}>
        {eq.name}
      </Text>
      <Flex gap="1" style={{ flexShrink: 0 }}>
        {interCount > 0 && <Badge size="1" color="orange" variant="soft">{interCount} iv</Badge>}
        {diCount > 0 && <Badge size="1" color="red" variant="soft">{diCount} DI</Badge>}
      </Flex>
    </GroupCard.Row>
  );
}

// ── Tasks/interventions panel ─────────────────────────────────────────────────

const TASK_ACCENT = {
  in_progress: 'var(--blue-9)',
  todo:        'var(--gray-6)',
  done:        'var(--green-8)',
};

const IV_STATUS_ORDER = ['ouvert', 'attente_pieces', 'attente_prod', 'ferme'];
const PRIORITY_ORDER  = ['urgent', 'important', 'normal', 'faible'];
const PRIORITY_LABELS = { urgent: 'Urgent', important: 'Important', normal: 'Normal', faible: 'Faible' };

// ── Helpers partagés avec TasksPane ──────────────────────────────────────────

function deriveInitials(assignedTo) {
  if (!assignedTo) return null;
  if (assignedTo.initial)   return String(assignedTo.initial).toUpperCase();
  if (assignedTo.initials)  return String(assignedTo.initials).toUpperCase();
  const f = String(assignedTo.first_name || '').trim();
  const l = String(assignedTo.last_name  || '').trim();
  return `${f[0] || ''}${l[0] || ''}`.toUpperCase() || null;
}

function userFullName(u) {
  const f = u.first_name || u.firstName || '';
  const l = u.last_name  || u.lastName  || '';
  return `${f} ${l}`.trim() || u.email || u.initials || String(u.id);
}

const formatDue = (iso) => {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

// ── Cellule date éditable (même pattern que TasksPane) ───────────────────────

function InlineDateCell({ taskId, value, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const today = new Date(); today.setHours(0,0,0,0);
  const overdue = value && new Date(value) < today;

  async function commit(v) {
    if (v === (value ?? '')) { setEditing(false); return; }
    setSaving(true);
    try { await patchInterventionTask(taskId, { due_date: v || null }); onSaved(); }
    catch { /* silencieux */ }
    finally { setSaving(false); setEditing(false); }
  }

  if (editing) {
    return (
      <input
        autoFocus type="date"
        defaultValue={value?.slice(0, 10) ?? ''}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditing(false); }}
        style={{ flexShrink: 0, fontSize: 11, padding: '1px 4px', borderRadius: 4, border: '1px solid var(--accent-8)', background: 'var(--color-background)', color: 'var(--gray-12)', outline: 'none' }}
      />
    );
  }

  return (
    <button
      type="button"
      disabled={saving}
      onClick={() => setEditing(true)}
      style={{ flexShrink: 0, background: 'none', border: 'none', padding: '1px 3px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: saving ? 0.5 : 1 }}
    >
      {overdue && value ? (
        <Badge color="red" variant="solid" size="1">{formatDue(value)}</Badge>
      ) : value ? (
        <Text size="1" color="gray" style={{ whiteSpace: 'nowrap' }}>{formatDue(value)}</Text>
      ) : (
        <Text size="1" style={{ color: 'var(--gray-6)', whiteSpace: 'nowrap' }}>+date</Text>
      )}
    </button>
  );
}

// ── Cellule affectation éditable (même pattern que TasksPane) ────────────────

function InlineAssignCell({ taskId, assignedTo, users, onSaved }) {
  const [editing, setSaving_] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const initials = deriveInitials(assignedTo);
  const currentId = String(assignedTo?.id ?? '');

  async function commit(v) {
    if (v === currentId) { setSaving_(false); return; }
    setSaving(true);
    try { await patchInterventionTask(taskId, { assigned_to: v || null }); onSaved(); }
    catch { /* silencieux */ }
    finally { setSaving(false); setSaving_(false); }
  }

  if (editing) {
    return (
      <select
        autoFocus defaultValue={currentId}
        onBlur={(e) => commit(e.target.value)}
        onChange={(e) => commit(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Escape') setSaving_(false); }}
        style={{ flexShrink: 0, fontSize: 11, padding: '1px 4px', borderRadius: 4, border: '1px solid var(--accent-8)', background: 'var(--color-background)', color: 'var(--gray-12)', outline: 'none', maxWidth: 140 }}
      >
        <option value="">— Non assigné</option>
        {users.map((u) => <option key={u.id} value={String(u.id)}>{userFullName(u)}</option>)}
      </select>
    );
  }

  return (
    <button
      type="button"
      disabled={saving}
      title={initials ? `${userFullName(assignedTo)} — modifier` : 'Assigner'}
      onClick={() => setSaving_(true)}
      style={{ flexShrink: 0, background: initials ? 'var(--accent-4)' : 'var(--gray-3)', border: '1px solid', borderColor: initials ? 'var(--accent-6)' : 'var(--gray-5)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, opacity: saving ? 0.5 : 1 }}
    >
      {initials
        ? <Text size="1" weight="bold" style={{ color: 'var(--accent-11)', fontSize: 9, lineHeight: 1 }}>{initials}</Text>
        : <Text size="1" style={{ color: 'var(--gray-9)', fontSize: 9 }}>+</Text>
      }
    </button>
  );
}

// ── Badge statut tâche — clic toggle todo ↔ in_progress ─────────────────────

const TASK_STATUS_CFG = {
  todo:        { color: 'gray',  label: 'À faire'  },
  in_progress: { color: 'blue',  label: 'En cours' },
  done:        { color: 'green', label: 'Terminé'  },
};

function InlineTaskStatus({ taskId, status, onSaved }) {
  const [saving, setSaving] = useState(false);
  const cfg = TASK_STATUS_CFG[status] ?? TASK_STATUS_CFG.todo;
  const next = status === 'in_progress' ? 'todo' : 'in_progress';

  async function handleClick() {
    if (saving) return;
    setSaving(true);
    try { await patchInterventionTask(taskId, { status: next }); onSaved(next); }
    catch { /* silencieux */ }
    finally { setSaving(false); }
  }

  return (
    <Badge size="1" color={cfg.color} variant="soft"
      style={{ flexShrink: 0, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}
      onClick={handleClick}
    >
      {saving ? '…' : cfg.label}
    </Badge>
  );
}

// ── Header intervention : statut + priorité inline ───────────────────────────

function InlineIvStatus({ ivId, status, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const cfg = STATUS_CONFIG[status] ?? { color: 'gray', label: status };

  async function handleSelect(val) {
    if (!val || val === status) { setEditing(false); return; }
    setSaving(true);
    try { await updateIntervention(ivId, { status: val }); onSaved({ status: val }); }
    catch (e) { console.error('[InlineIvStatus]', e); }
    finally { setSaving(false); setEditing(false); }
  }

  if (editing) {
    return (
      <Select.Root onValueChange={handleSelect} defaultOpen onOpenChange={(o) => { if (!o) setEditing(false); }}>
        <Select.Trigger size="1" style={{ fontSize: 11 }} />
        <Select.Content>
          {IV_STATUS_ORDER.map((s) => (
            <Select.Item key={s} value={s}>{STATUS_CONFIG[s]?.label ?? s}</Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    );
  }

  return (
    <Badge size="1" color={cfg.color} variant="soft"
      style={{ flexShrink: 0, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}
      onClick={() => { if (!saving) setEditing(true); }}
    >
      {saving ? '…' : cfg.label}
    </Badge>
  );
}

function InlineIvPriority({ ivId, priority, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const cfg = PRIORITY_CONFIG[priority] ?? { color: 'gray' };

  async function handleSelect(val) {
    if (!val || val === priority) { setEditing(false); return; }
    setSaving(true);
    try { await updateIntervention(ivId, { priority: val }); onSaved({ priority: val }); }
    catch (e) { console.error('[InlineIvPriority]', e); }
    finally { setSaving(false); setEditing(false); }
  }

  if (editing) {
    return (
      <Select.Root onValueChange={handleSelect} defaultOpen onOpenChange={(o) => { if (!o) setEditing(false); }}>
        <Select.Trigger size="1" style={{ fontSize: 11 }} />
        <Select.Content>
          {PRIORITY_ORDER.map((p) => (
            <Select.Item key={p} value={p}>{PRIORITY_LABELS[p] ?? p}</Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    );
  }

  return (
    <Badge size="1" color={cfg.color} variant="outline"
      style={{ flexShrink: 0, cursor: 'pointer', opacity: saving ? 0.5 : 1 }}
      onClick={() => { if (!saving) setEditing(true); }}
    >
      {saving ? '…' : (PRIORITY_LABELS[priority] ?? priority)}
    </Badge>
  );
}

// ── InterventionTasksBlock ────────────────────────────────────────────────────

function InterventionTasksBlock({ intervention, users, onTaskCreated, onTaskStatusChanged, onTaskDeleted, onIvChanged }) {
  const typeColor = INTERVENTION_TYPES.find((t) => t.id === intervention.type)?.color ?? 'gray';
  const tasks     = intervention.tasks ?? null;
  const planned   = tasks ? tasks.filter((t) => t.due_date)  : null;
  const unplanned = tasks ? tasks.filter((t) => !t.due_date) : null;
  const totalCount = tasks?.length ?? null;

  function TaskLine({ task, isLast = false }) {
    const [hovered, setHovered] = useState(false);
    const isDone    = task.status === 'done';
    const isSkipped = task.status === 'skipped';
    const canDelete = (task.action_count ?? task.actions?.length ?? 0) === 0;

    return (
      <GroupCard.Row
        accentColor={TASK_ACCENT[task.status] ?? 'var(--gray-6)'}
        isLast={isLast}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <InlineTaskStatus taskId={task.id} status={task.status} onSaved={(newStatus) => onTaskStatusChanged(intervention.id, task.id, newStatus)} />
        <Text size="1" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: (isDone || isSkipped) ? 'line-through' : 'none', color: (isDone || isSkipped) ? 'var(--gray-9)' : undefined }}>
          {task.label}
        </Text>
        <TaskActionButtons
          taskId={task.id}
          status={task.status}
          visible={hovered}
          mode="live"
          canDelete={canDelete}
          onStatusChange={(taskId, newStatus) => onTaskStatusChanged(intervention.id, taskId, newStatus)}
          onDeleted={(taskId) => onTaskDeleted(intervention.id, taskId)}
        />
        <InlineAssignCell taskId={task.id} assignedTo={task.assigned_to ?? null} users={users} onSaved={onTaskCreated} />
        <InlineDateCell   taskId={task.id} value={task.due_date} onSaved={onTaskCreated} />
      </GroupCard.Row>
    );
  }

  return (
    <GroupCard
      code={intervention.code}
      title={intervention.title}
      badge={<Badge size="1" color={typeColor} variant="soft" style={{ flexShrink: 0 }}>{intervention.type}</Badge>}
      headerRight={
        <Flex gap="1" style={{ flexShrink: 0 }}>
          <InlineIvStatus   ivId={intervention.id} status={intervention.status}           onSaved={(updates) => onIvChanged(intervention.id, updates)} />
          <InlineIvPriority ivId={intervention.id} priority={intervention.priority ?? 'normal'} onSaved={(updates) => onIvChanged(intervention.id, updates)} />
        </Flex>
      }
      count={totalCount}
      countLabel="tâche"
    >
      {tasks === null && (
        <Flex align="center" justify="center" style={{ padding: '8px 0' }}><Spinner size="1" /></Flex>
      )}
      {tasks !== null && tasks.length === 0 && (
        <Text size="1" color="gray" style={{ display: 'block', padding: '8px 10px' }}>Aucune tâche ouverte</Text>
      )}
      {planned && planned.map((task, i) => (
        <TaskLine key={task.id} task={task} isLast={i === planned.length - 1 && !unplanned?.length} />
      ))}
      {unplanned && unplanned.length > 0 && (
        <>
          <Flex align="center" gap="2" style={{ padding: '4px 10px', borderTop: planned?.length ? '1px solid var(--gray-4)' : undefined, borderBottom: '1px solid var(--gray-3)' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--gray-4)' }} />
            <Text size="1" color="gray" style={{ flexShrink: 0, fontSize: 10, letterSpacing: '0.04em' }}>Sans échéance</Text>
            <div style={{ flex: 1, height: 1, background: 'var(--gray-4)' }} />
          </Flex>
          {unplanned.map((task, i) => (
            <TaskLine key={task.id} task={task} isLast={i === unplanned.length - 1} />
          ))}
        </>
      )}
      <GhostCreateRow interventionId={intervention.id} users={users} onCreated={onTaskCreated} />
    </GroupCard>
  );
}

// ── DI panel ─────────────────────────────────────────────────────────────────

function DIRow({ di, onClick }) {
  const age = getDaysOpen(di.created_at);
  const eq = di.equipement ?? null;

  return (
    <Flex
      gap="2"
      direction="column"
      onClick={onClick}
      style={{
        padding: '8px 10px',
        borderBottom: '1px solid var(--gray-4)',
        cursor: 'pointer',
        borderRadius: 4,
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gray-2)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = ''; }}
    >
      <Flex align="center" gap="2">
        <Text size="1" style={{ fontFamily: 'monospace', color: 'var(--gray-9)', flexShrink: 0 }}>
          {di.code}
        </Text>
        {eq && (
          <Badge size="1" color="blue" variant="soft" style={{ fontFamily: 'monospace', flexShrink: 0 }}>
            {eq.code ?? eq.name}
          </Badge>
        )}
        <Badge size="1" color={age > 7 ? 'red' : age > 3 ? 'orange' : 'gray'} variant="soft" style={{ marginLeft: 'auto', flexShrink: 0 }}>
          {age}j
        </Badge>
      </Flex>
      <Text size="2" style={{ color: 'var(--gray-12)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
        {di.description ?? '—'}
      </Text>
      <Text size="1" color="gray">
        {di.demandeur_nom ?? '—'}
        {di.service?.label ? ` · ${di.service.label}` : ''}
      </Text>
    </Flex>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CoordinationPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const users = useUsers();

  const today = todayIso();
  const currentMonday = getMondayOf(today);

  const weekParam = searchParams.get('week');
  const [monday, setMondayState] = useState(() =>
    weekParam ? mondayFromISOWeek(weekParam) : currentMonday
  );

  const friday = addDays(monday, 4);

  const setMonday = useCallback((m) => {
    setMondayState(m);
    setSearchParams((prev) => { prev.set('week', getISOWeekString(m)); return prev; }, { replace: true });
  }, [setSearchParams]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [weekTasks, setWeekTasks] = useState([]);
  const [weekTasksLoading, setWeekTasksLoading] = useState(false);

  const [equipements, setEquipements] = useState([]);
  const [equipeLoading, setEquipeLoading] = useState(false);

  const [selectedEquipId, setSelectedEquipId] = useState(null);
  const [ivList, setIvList] = useState([]);
  const [ivTasksMap, setIvTasksMap] = useState({});
  const [ivLoading, setIvLoading] = useState(false);

  const [equipDIs, setEquipDIs] = useState([]);
  const [activeTab, setActiveTab] = useState('interventions');

  // ── Load week tasks ────────────────────────────────────────────────────────
  const loadWeekTasks = useCallback(async () => {
    setWeekTasksLoading(true);
    try {
      const raw = await fetchInterventionTasksList({
        due_date_after: monday,
        due_date_before: friday,
        include_done: true,
        limit: 200,
      });
      const flat = raw.flatMap((item) =>
        (Array.isArray(item.tasks) ? item.tasks : []).map((task) => {
          const at = task.assigned_to;
          const initials = at
            ? (at.initials || `${at.first_name?.[0] ?? ''}${at.last_name?.[0] ?? ''}`).toUpperCase()
            : (task.assigned_to_initials ?? task.tech_initials ?? '');
          return {
            ...task,
            _initials: initials,
            _intervention: {
              id: item.id,
              code: item.code,
              title: item.title,
              equipement: item.equipement ?? null,
            },
          };
        })
      );
      setWeekTasks(flat);
    } catch {
      setWeekTasks([]);
    } finally {
      setWeekTasksLoading(false);
    }
  }, [monday, friday]);

  useEffect(() => { loadWeekTasks(); }, [loadWeekTasks]);

  // ── Load equipements ───────────────────────────────────────────────────────
  useEffect(() => {
    setEquipeLoading(true);
    Promise.allSettled([
      fetchEquipements({ limit: 500 }),
      fetchInterventions({ status: 'ouvert,en_cours', limit: 500 }),
      fetchInterventionRequests({ statut: 'nouvelle', limit: 200 }),
    ]).then(([eqRes, ivRes, diRes]) => {
      const eqItems = eqRes.status === 'fulfilled' ? (eqRes.value.items ?? []) : [];
      const ivItems = ivRes.status === 'fulfilled' ? ivRes.value : [];
      const diItems = diRes.status === 'fulfilled' ? (diRes.value.items ?? []) : [];

      const ivCountByEquip = {};
      ivItems.forEach((iv) => {
        const eqId = iv.machine?.id ?? iv.equipementId;
        if (eqId) ivCountByEquip[eqId] = (ivCountByEquip[eqId] ?? 0) + 1;
      });

      const diCountByEquip = {};
      diItems.forEach((di) => {
        const eqId = di.equipement?.id ?? di.machine_id;
        if (eqId) diCountByEquip[eqId] = (diCountByEquip[eqId] ?? 0) + 1;
      });

      const enriched = eqItems
        .map((eq) => ({
          ...eq,
          _interventionCount: ivCountByEquip[eq.id] ?? 0,
          _diCount: diCountByEquip[eq.id] ?? 0,
        }))
        .sort((a, b) => {
          const ha = HEALTH_ORDER[a.health?.level] ?? 4;
          const hb = HEALTH_ORDER[b.health?.level] ?? 4;
          if (ha !== hb) return ha - hb;
          const ca = (b._interventionCount + b._diCount) - (a._interventionCount + a._diCount);
          if (ca !== 0) return ca;
          return (a.name ?? '').localeCompare(b.name ?? '');
        });

      setEquipements(enriched);
    }).finally(() => setEquipeLoading(false));
  }, []);


  // ── Load interventions + tasks for selected equipment ──────────────────────
  const loadIvTasks = useCallback(async (equipId) => {
    if (!equipId) { setIvList([]); setIvTasksMap({}); setEquipDIs([]); return; }
    setIvLoading(true);
    try {
      const [ivs, diRes] = await Promise.all([
        fetchInterventions({ equipementId: equipId, status: 'ouvert,en_cours', include: 'stats', limit: 100 }),
        fetchInterventionRequests({ machineId: equipId, statut: 'nouvelle', limit: 100 }).catch(() => ({ items: [] })),
      ]);

      setIvList(ivs);
      setEquipDIs(diRes.items ?? []);

      const taskResults = await Promise.allSettled(
        ivs.map(async (iv) => {
          const raw = await fetchInterventionTasksList({ intervention_id: iv.id, include_done: true, limit: 100 });
          const tasks = raw.flatMap((item) => Array.isArray(item.tasks) ? item.tasks : []);
          return { id: iv.id, tasks };
        })
      );
      const map = {};
      taskResults.forEach((r) => { if (r.status === 'fulfilled') map[r.value.id] = r.value.tasks; });
      setIvTasksMap(map);
    } catch {
      setIvList([]);
      setIvTasksMap({});
      setEquipDIs([]);
    } finally {
      setIvLoading(false);
    }
  }, []);

  const prevSelectedEquipId = useRef(null);
  useEffect(() => {
    if (selectedEquipId !== prevSelectedEquipId.current) {
      prevSelectedEquipId.current = selectedEquipId;
      loadIvTasks(selectedEquipId);
    }
  }, [selectedEquipId, loadIvTasks]);

  const handleTaskCreated = useCallback(() => {
    loadIvTasks(selectedEquipId);
    loadWeekTasks();
  }, [loadIvTasks, loadWeekTasks, selectedEquipId]);

  const handleTaskStatusChanged = useCallback((ivId, taskId, newStatus) => {
    setIvTasksMap((prev) => ({
      ...prev,
      [ivId]: (prev[ivId] ?? []).map((t) =>
        String(t.id) === String(taskId) ? { ...t, status: newStatus } : t
      ),
    }));
  }, []);

  const handleTaskDeleted = useCallback((ivId, taskId) => {
    setIvTasksMap((prev) => ({
      ...prev,
      [ivId]: (prev[ivId] ?? []).filter((t) => String(t.id) !== String(taskId)),
    }));
  }, []);

  const handleIvChanged = useCallback((ivId, updates) => {
    setIvList((prev) => prev.map((iv) =>
      String(iv.id) === String(ivId) ? { ...iv, ...updates } : iv
    ));
  }, []);

  // ── Subtitle ───────────────────────────────────────────────────────────────
  const subtitle = formatSubtitle(monday, friday);

  // ── Nav ────────────────────────────────────────────────────────────────────
  const prevWeek = () => setMonday(addDays(monday, -7));
  const nextWeek = () => setMonday(addDays(monday, 7));
  const goToday  = () => setMonday(currentMonday);
  const isCurrentWeek = monday === currentMonday;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Header page ──────────────────────────────────────────────────────── */}
      <PageHeader
        title="Coordination"
        subtitle={subtitle}
        icon={CalendarDays}
        noMargin
        actions={[{
          label: (
            <Flex align="center" gap="1">
              <Button size="1" variant="soft" color="gray" onClick={prevWeek}><ChevronLeft size={14} /></Button>
              <Button size="1" variant={isCurrentWeek ? 'solid' : 'soft'} color="blue" onClick={goToday} disabled={isCurrentWeek}>
                Auj.
              </Button>
              <Button size="1" variant="soft" color="gray" onClick={nextWeek}><ChevronRight size={14} /></Button>
            </Flex>
          ),
        }]}
      />

      {/* ── Planning semaine ─────────────────────────────────────────────────── */}
      <div style={{ flexShrink: 0, padding: '10px 16px', overflowX: 'auto' }}>
        <WeekPlanning
          monday={monday}
          tasks={weekTasks}
          loading={weekTasksLoading}
        />
      </div>

      {/* ── Trois panneaux ───────────────────────────────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: '1fr 2fr', borderTop: '1px solid var(--gray-4)' }}>

        {/* ── Équipements ──────────────────────────────────────────────────── */}
        <div style={{ borderRight: '1px solid var(--gray-4)', display: 'flex', flexDirection: 'column', minHeight: 0, padding: '10px 8px' }}>
          <GroupCard
            title="Équipements"
            titleItalic={false}
            count={equipeLoading ? null : equipements.length}
            countLabel="équipement"
            style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', marginBottom: 0, overflow: 'hidden' }}
          >
            {equipeLoading ? (
              <Flex align="center" justify="center" py="4"><Spinner size="2" /></Flex>
            ) : (
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {equipements.map((eq, i) => (
                  <EquipementLine
                    key={eq.id}
                    eq={eq}
                    isSelected={selectedEquipId === eq.id}
                    onSelect={setSelectedEquipId}
                    isLast={i === equipements.length - 1}
                  />
                ))}
              </div>
            )}
          </GroupCard>
        </div>

        {/* ── Panneau central : Tabs Interventions / DI ────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {!selectedEquipId ? (
            <Flex direction="column" align="center" justify="center" gap="2" style={{ flex: 1, color: 'var(--gray-8)' }}>
              <MousePointerClick size={22} strokeWidth={1.5} />
              <Text size="2" color="gray">Sélectionne un équipement</Text>
            </Flex>
          ) : (
            <Tabs.Root value={activeTab} onValueChange={setActiveTab} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
              <Tabs.List style={{ flexShrink: 0, borderBottom: '1px solid var(--gray-4)', background: 'var(--gray-2)', padding: '0 10px' }}>
                <Tabs.Trigger value="interventions">
                  Interventions
                  {!ivLoading && ivList.length > 0 && (
                    <Badge size="1" color="orange" variant="soft" ml="1">{ivList.length}</Badge>
                  )}
                </Tabs.Trigger>
                <Tabs.Trigger value="di">
                  Demandes
                  {!ivLoading && equipDIs.length > 0 && (
                    <Badge size="1" color="red" variant="soft" ml="1">{equipDIs.length}</Badge>
                  )}
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content value="interventions" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 10px' }}>
                {ivLoading && <Flex align="center" justify="center" style={{ height: 80 }}><Spinner size="2" /></Flex>}
                {!ivLoading && ivList.length === 0 && (
                  <Flex align="center" justify="center" style={{ height: 80 }}>
                    <Text size="2" color="gray">Aucune intervention ouverte</Text>
                  </Flex>
                )}
                {!ivLoading && ivList.map((iv) => (
                  <InterventionTasksBlock
                    key={iv.id}
                    intervention={{ ...iv, tasks: ivTasksMap[iv.id] ?? null }}
                    users={users}
                    onTaskCreated={handleTaskCreated}
                    onTaskStatusChanged={handleTaskStatusChanged}
                    onTaskDeleted={handleTaskDeleted}
                    onIvChanged={handleIvChanged}
                  />
                ))}
              </Tabs.Content>

              <Tabs.Content value="di" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
                {ivLoading && <Flex align="center" justify="center" style={{ height: 80 }}><Spinner size="2" /></Flex>}
                {!ivLoading && equipDIs.length === 0 && (
                  <Flex align="center" justify="center" style={{ height: 80 }}>
                    <Text size="2" color="gray">Aucune demande pour cet équipement</Text>
                  </Flex>
                )}
                {!ivLoading && equipDIs.map((di) => (
                  <DIRow key={di.id} di={di} onClick={() => navigate(`/briefing/di/${di.id}`)} />
                ))}
              </Tabs.Content>
            </Tabs.Root>
          )}
        </div>
      </div>
    </div>
  );
}
