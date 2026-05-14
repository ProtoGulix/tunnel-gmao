import { useState, useEffect, useCallback } from 'react';
import { Flex, Text, Spinner, Callout, Button, Badge, IconButton } from '@radix-ui/themes';
import {
  AlertCircle, ClipboardList, Clock, Package, ExternalLink,
  CalendarClock, UserCog, Wrench, CheckCircle2, MinusCircle, Circle,
  AlertTriangle, Plus, ChevronUp, ChevronDown, Inbox, User,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import InterventionRequestDetail from '@/components/intervention-requests/InterventionRequestDetail';
import PageHeader from '@/components/layout/PageHeader';
import { BriefingCounters } from '@/components/briefing/BriefingCounters';
import { BriefingSection } from '@/components/briefing/BriefingSection';
import { BriefingItem } from '@/components/briefing/BriefingItem';
import { useBriefingData } from '@/hooks/useBriefingData';
import { fetchIntervention } from '@/api/interventions';
import { patchInterventionTask } from '@/api/interventionTasks';
import { STATUS_CONFIG, TYPE_INTER_LABELS } from '@/config/interventionTypes';
import DataTable from '@/components/ui/DataTable';
import TaskCreateForm from '@/components/tasks/TaskCreateForm';
import { useTaskCreate } from '@/hooks/tasks/useTaskCreate';

/* ── Task status config ─────────────────────────────────────────────────── */

const TASK_STATUS_CONFIG = {
  todo:        { Icon: Circle,       color: 'var(--gray-7)',   label: 'À faire' },
  in_progress: { Icon: Clock,        color: 'var(--blue-9)',   label: 'En cours' },
  done:        { Icon: CheckCircle2, color: 'var(--green-9)',  label: 'Fait' },
  skipped:     { Icon: MinusCircle,  color: 'var(--orange-9)', label: 'Ignorée' },
};

const ORIGIN_CONFIG = {
  plan: { Icon: CalendarClock, color: 'var(--violet-9)', label: 'Préventif' },
  resp: { Icon: UserCog,       color: 'var(--orange-9)', label: 'Responsable' },
  tech: { Icon: Wrench,        color: 'var(--blue-9)',   label: 'Technicien' },
};

const PRIORITY_CONFIG = {
  urgent:    { color: 'red',    label: 'Urgent' },
  important: { color: 'orange', label: 'Important' },
  normale:   { color: 'gray',   label: 'Normale' },
  faible:    { color: 'gray',   label: 'Faible' },
};

const TASK_SORT = { in_progress: 0, todo: 1, skipped: 2, done: 3 };

/* ── Task table columns ─────────────────────────────────────────────────── */

function buildTaskColumns({ onMoveUp, onMoveDown, tasks, editCell, onStartEdit, onSaveField, onCancelEdit, users, editSaving }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);

  return [
    {
      key: 'order',
      header: '#',
      width: 60,
      align: 'center',
      render: (task) => {
        const idx = tasks.findIndex((t) => t.id === task.id);
        const isFirst = idx === 0;
        const isLast = idx === tasks.length - 1;
        return (
          <Flex align="center" gap="1">
            <Text size="1" color="gray" style={{ fontFamily: 'monospace', minWidth: 16, textAlign: 'right' }}>
              {task.sort_order ?? idx + 1}
            </Text>
            <Flex direction="column" gap="0">
              <IconButton size="1" variant="ghost" color="gray" disabled={isFirst}
                onClick={(e) => { e.stopPropagation(); onMoveUp(task, idx); }}>
                <ChevronUp size={11} />
              </IconButton>
              <IconButton size="1" variant="ghost" color="gray" disabled={isLast}
                onClick={(e) => { e.stopPropagation(); onMoveDown(task, idx); }}>
                <ChevronDown size={11} />
              </IconButton>
            </Flex>
          </Flex>
        );
      },
    },
    {
      key: 'status',
      header: '',
      width: 24,
      render: (task) => {
        const cfg = TASK_STATUS_CONFIG[task.status] ?? TASK_STATUS_CONFIG.todo;
        return <cfg.Icon size={13} color={cfg.color} />;
      },
    },
    {
      key: 'label',
      header: 'Tâche',
      render: (task) => (
        <Flex align="center" gap="2" style={{ flexWrap: 'wrap', opacity: editSaving === task.id ? 0.5 : 1, transition: 'opacity 0.15s' }}>
          <Text size="2" weight={task.status === 'in_progress' ? 'bold' : 'regular'}
            style={{ color: 'var(--gray-12)', opacity: task.status === 'done' ? 0.65 : 1 }}>
            {task.label}
          </Text>
          {task.optional && <Badge size="1" variant="soft" color="gray">opt.</Badge>}
          {task.status === 'skipped' && task.skip_reason && (
            <Text size="1" color="orange" style={{ fontStyle: 'italic' }}>{task.skip_reason}</Text>
          )}
        </Flex>
      ),
    },
    {
      key: 'due_date',
      header: 'Échéance',
      width: 90,
      align: 'center',
      render: (task) => {
        const overdue = task.due_date && new Date(task.due_date) < today;
        const dueFmt = task.due_date
          ? new Date(task.due_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
          : null;
        const editing = editCell?.taskId === task.id && editCell?.field === 'due_date';

        if (editing) {
          return (
            <input
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              type="date"
              defaultValue={task.due_date?.slice(0, 10) ?? ''}
              onBlur={(e) => {
                const v = e.target.value;
                if (v !== (task.due_date?.slice(0, 10) ?? '')) {
                  onSaveField(task.id, 'due_date', v || null);
                } else {
                  onCancelEdit();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.target.blur();
                if (e.key === 'Escape') onCancelEdit();
              }}
              onClick={(e) => e.stopPropagation()}
              style={{ fontSize: 11, padding: '1px 4px', borderRadius: 4, border: '1px solid var(--accent-8)', background: 'var(--color-background)', color: 'var(--gray-12)', outline: 'none', width: 110 }}
            />
          );
        }

        return (
          <button
            type="button"
            title="Modifier l'échéance"
            onClick={(e) => { e.stopPropagation(); onStartEdit(task.id, 'due_date'); }}
            style={{ background: 'none', border: 'none', padding: '1px 3px', borderRadius: 4, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, margin: '0 auto' }}
          >
            {overdue && dueFmt ? (
              <Badge color="red" variant="solid" size="1" style={{ display: 'flex', alignItems: 'center', gap: 3, pointerEvents: 'none' }}>
                <AlertTriangle size={10} />{dueFmt}
              </Badge>
            ) : dueFmt ? (
              <Text size="1" color="gray">{dueFmt}</Text>
            ) : (
              <Text size="1" style={{ color: 'var(--gray-6)' }}>+date</Text>
            )}
          </button>
        );
      },
    },
    {
      key: 'origin',
      header: 'Origine',
      width: 100,
      render: (task) => {
        const cfg = ORIGIN_CONFIG[task.origin];
        const isGamme = !!task.gamme_step_id;
        return (
          <Flex align="center" gap="1">
            {cfg && <cfg.Icon size={11} color={cfg.color} />}
            {cfg && <Text size="1" style={{ color: cfg.color }}>{cfg.label}</Text>}
            {isGamme
              ? <Badge size="1" color="green" variant="soft">Gamme</Badge>
              : <Badge size="1" color="gray" variant="soft">Manuelle</Badge>}
          </Flex>
        );
      },
    },
    {
      key: 'assigned',
      header: 'Tech',
      width: 60,
      align: 'center',
      render: (task) => {
        const assignedTo = task.assigned_to ?? null;
        const initials = assignedTo
          ? (assignedTo.initial ?? `${assignedTo.first_name?.[0] ?? ''}${assignedTo.last_name?.[0] ?? ''}`).toUpperCase()
          : null;
        const currentAssigneeId = String(assignedTo?.id ?? '');
        const editing = editCell?.taskId === task.id && editCell?.field === 'assigned_to';

        if (editing) {
          return (
            <select
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              defaultValue={currentAssigneeId}
              onChange={(e) => { onSaveField(task.id, 'assigned_to', e.target.value || null); }}
              onBlur={(e) => { if (e.target.value === currentAssigneeId) onCancelEdit(); }}
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
          );
        }

        return (
          <button
            type="button"
            title={initials ? `Affecté — modifier` : 'Assigner'}
            onClick={(e) => { e.stopPropagation(); onStartEdit(task.id, 'assigned_to'); }}
            style={{
              background: initials ? 'var(--accent-4)' : 'var(--gray-3)',
              border: '1px solid',
              borderColor: initials ? 'var(--accent-6)' : 'var(--gray-5)',
              borderRadius: '50%',
              width: 22,
              height: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
              margin: '0 auto',
            }}
          >
            {initials ? (
              <Text size="1" weight="bold" style={{ color: 'var(--accent-11)', fontSize: 9, lineHeight: 1 }}>
                {initials}
              </Text>
            ) : (
              <User size={11} color="var(--gray-9)" />
            )}
          </button>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      width: 90,
      align: 'end',
      render: (task) => {
        if (!task.action_count) return null;
        return (
          <Flex align="center" gap="1" justify="end">
            <Clock size={11} color="var(--gray-9)" />
            <Text size="1" color="gray">{task.action_count} · {task.time_spent}h</Text>
          </Flex>
        );
      },
    },
    {
      key: 'closed',
      header: 'Clôturée',
      width: 80,
      align: 'center',
      render: (task) => {
        if (!task.updated_at || (task.status !== 'done' && task.status !== 'skipped')) return null;
        const d = new Date(task.updated_at);
        const fmt = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
        return (
          <Text size="1" color="gray">{fmt}</Text>
        );
      },
    },
  ];
}

/* ── Request item (tuile DI) ────────────────────────────────────────────── */

const REQUEST_STATUT_COLOR = {
  nouvelle:   'var(--gray-9)',
  en_attente: 'var(--amber-9)',
};

function RequestItem({ request }) {
  const barColor = REQUEST_STATUT_COLOR[request.statut] ?? 'var(--gray-9)';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const created = new Date(request.created_at);
  const daysWaiting = Math.floor((today - created) / 86400000);

  return (
    <div style={{
      display: 'flex',
      background: 'var(--color-panel-solid)',
      border: '1px solid var(--gray-4)',
      borderLeft: `3px solid ${barColor}`,
      borderRadius: 6,
      overflow: 'hidden',
    }}>
      <Flex direction="column" style={{ flex: 1, padding: '10px 12px' }} gap="1">
        <Flex align="center" gap="2" wrap="wrap">
          <Text size="1" weight="medium" style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--gray-12)' }}>
            {request.code}
          </Text>
          <Badge size="1" variant="soft"
            style={{ backgroundColor: request.statut_color + '22', color: request.statut_color }}>
            {request.statut_label}
          </Badge>
          {request.equipement?.code && (
            <Badge size="1" variant="outline" color="gray">{request.equipement.code}</Badge>
          )}
        </Flex>
        <Text size="2" weight="medium"
          style={{ color: 'var(--gray-12)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {request.description}
        </Text>
        <Text size="1" color="gray">
          {request.demandeur_nom}
          {request.service?.label ? ` · ${request.service.label}` : ''}
          {request.equipement?.name ? ` · ${request.equipement.name}` : ''}
        </Text>
      </Flex>
      <Flex direction="column" align="center" justify="center" gap="1"
        style={{ marginLeft: 8, paddingRight: 12, flexShrink: 0 }}>
        <Inbox size={13} color="var(--gray-8)" />
        <Text size="1" weight="medium"
          style={{ color: daysWaiting > 7 ? 'var(--red-11)' : daysWaiting > 3 ? 'var(--orange-11)' : 'var(--gray-11)', lineHeight: 1 }}>
          {daysWaiting === 0 ? 'auj.' : `${daysWaiting}j`}
        </Text>
      </Flex>
    </div>
  );
}

/* ── Detail panel ───────────────────────────────────────────────────────── */

function DetailPanel({ situation }) {
  const [detail, setDetail]   = useState(null);
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editCell, setEditCell] = useState(null); // { taskId, field }
  const [editSaving, setEditSaving] = useState(null); // taskId being saved

  const loadDetail = (id) => {
    setDetail(null);
    setTasks([]);
    setLoading(true);
    setShowForm(false);
    fetchIntervention(id)
      .then((iv) => { setDetail(iv); setTasks(Array.isArray(iv.tasks) ? iv.tasks : []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const startEdit = useCallback((taskId, field) => setEditCell({ taskId, field }), []);
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
  }, [situation?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (situation?.id) loadDetail(situation.id);
  }, [situation?.id]);

  const taskCreate = useTaskCreate({
    interventionId: situation ? String(situation.id) : null,
    onSuccess: () => {
      setShowForm(false);
      if (situation?.id) loadDetail(situation.id);
    },
  });

  if (!situation) {
    return (
      <Flex align="center" justify="center" direction="column" gap="3"
        style={{ height: '100%', minHeight: 300, color: 'var(--gray-8)' }}>
        <ClipboardList size={32} strokeWidth={1.5} />
        <Text size="2" color="gray">Sélectionne une intervention</Text>
      </Flex>
    );
  }

  const statusCfg   = STATUS_CONFIG[situation.status_actual] ?? null;
  const priorityCfg = PRIORITY_CONFIG[situation.priority] ?? PRIORITY_CONFIG.normale;
  const typeLabel   = TYPE_INTER_LABELS[situation.type] ?? situation.type ?? '—';

  const totalTime    = detail?.stats?.totalTime ?? detail?.action?.reduce((s, a) => s + (Number(a.timeSpent) || 0), 0) ?? situation.stats?.totalTime ?? 0;
  const actionCount  = detail?.stats?.actionCount ?? detail?.action?.length ?? situation.stats?.actionCount ?? 0;
  const purchaseCount = detail?.stats?.purchasePending ?? situation.stats?.purchasePending ?? situation.stats?.purchaseCount ?? 0;
  const daysOpen     = situation.daysOpen ?? 0;

  const sortedTasks = [...tasks].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );

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

  const taskColumns = buildTaskColumns({
    tasks: sortedTasks,
    onMoveUp: (task, idx) => handleMove(task, idx, -1),
    onMoveDown: (task, idx) => handleMove(task, idx, 1),
    editCell,
    onStartEdit: startEdit,
    onSaveField: saveField,
    onCancelEdit: cancelEdit,
    users: taskCreate.users,
    editSaving,
  });

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

      {/* ── Header ── */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--gray-4)', flexShrink: 0 }}>
        <Flex align="center" gap="2" mb="2">
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

        <Text size="3" weight="medium" style={{ display: 'block', color: 'var(--gray-12)', marginBottom: 2 }}>
          {situation.title}
        </Text>

        {situation.machine && (
          <Text size="2" color="gray" style={{ display: 'block', fontStyle: 'italic' }}>
            {situation.machine.code} — {situation.machine.name}
          </Text>
        )}

        {detail?.request && (
          <Flex align="center" gap="2" mt="2" style={{ padding: '5px 8px', background: 'var(--gray-2)', borderRadius: 4 }}>
            <ClipboardList size={12} color="var(--gray-9)" style={{ flexShrink: 0 }} />
            <Text size="1" color="gray">
              <strong>{detail.request.code}</strong>
              {detail.request.demandeur_nom ? ` · ${detail.request.demandeur_nom}` : ''}
              {detail.request.description ? ` — ${detail.request.description}` : ''}
            </Text>
          </Flex>
        )}

        <Flex align="center" gap="3" mt="2" style={{ flexWrap: 'wrap' }}>
          <Flex align="center" gap="1">
            <Clock size={12} color="var(--gray-9)" />
            <Text size="1" color="gray">
              <strong>{actionCount}</strong> action{actionCount !== 1 ? 's' : ''} · <strong>{totalTime}h</strong>
            </Text>
          </Flex>
          <Text size="1" color="gray"><strong>{daysOpen}j</strong> ouvert</Text>
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
      </div>

      {/* ── Tasks + Form ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading && <Flex justify="center" pt="4"><Spinner size="2" /></Flex>}

        {!loading && (
          <DataTable
            columns={taskColumns}
            data={sortedTasks}
            size="1"
            variant="ghost"
            stickyHeader={false}
            emptyState={{ title: 'Aucune tâche', description: 'Aucune tâche liée à cette intervention' }}
            rowStyles={(task) => ({
              opacity: task.status === 'done' ? 0.6 : 1,
              background: task.status === 'done' ? 'var(--green-2)'
                : task.status === 'skipped' ? 'var(--orange-2)'
                : undefined,
            })}
          />
        )}

        {/* Add task button / form */}
        {!loading && (
          showForm ? (
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
            <Button size="1" variant="soft" color="blue" onClick={() => setShowForm(true)}>
              <Plus size={13} /> Ajouter une tâche
            </Button>
          )
        )}
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────── */

export default function BriefingPage() {
  const { sections, counters, loading, error, retry } = useBriefingData();
  const [selected, setSelected] = useState(null); // { type: 'situation'|'request', item }

  const visibleSections = sections.filter((s) => s.items.length > 0);
  const allEmpty = !loading && !error && visibleSections.length === 0;

  const handleSelect = (item, sectionType) => {
    setSelected({ type: sectionType === 'requests' ? 'request' : 'situation', item });
  };

  return (
    <>
      <PageHeader title="Briefing" subtitle="Situations actives et décisions en attente" icon={ClipboardList} />

      <div style={{ display: 'flex', alignItems: 'flex-start', height: 'calc(100vh - 64px)' }}>

        {/* ── Left — list ──────────────────────────────────────────────── */}
        <div style={{ width: '42%', borderRight: '1px solid var(--gray-5)', height: '100%', overflowY: 'auto', padding: '10px 14px' }}>
          <BriefingCounters counters={counters} loading={loading} />

          {error && (
            <Callout.Root color="red" style={{ marginBottom: 14 }}>
              <Callout.Icon><AlertCircle size={16} /></Callout.Icon>
              <Callout.Text>{error}</Callout.Text>
              <Button size="1" variant="soft" color="red" onClick={retry} style={{ marginLeft: 'auto' }}>
                Réessayer
              </Button>
            </Callout.Root>
          )}

          {loading && <Flex justify="center" pt="4"><Spinner size="2" /></Flex>}

          {allEmpty && (
            <Flex align="center" justify="center" style={{ minHeight: 200 }}>
              <Text size="3" style={{ color: 'var(--green-11)', textAlign: 'center' }}>
                Tout est sous contrôle — aucune situation active
              </Text>
            </Flex>
          )}

          {!loading && visibleSections.map((section, idx) => (
            <BriefingSection key={section.id} label={section.label} isFirst={idx === 0}>
              {section.items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item, section.type)}
                  style={{
                    cursor: 'pointer',
                    borderRadius: 6,
                    outline: selected?.item?.id === item.id ? '2px solid var(--blue-8)' : 'none',
                    outlineOffset: 1,
                  }}
                >
                  {section.type === 'requests'
                    ? <RequestItem request={item} />
                    : <BriefingItem situation={item} sectionId={section.id} />
                  }
                </div>
              ))}
            </BriefingSection>
          ))}
        </div>

        {/* ── Right — detail ───────────────────────────────────────────── */}
        <div style={{ flex: 1, height: '100%', minWidth: 0, overflowY: 'auto' }}>
          {selected?.type === 'request' ? (
            <div style={{ padding: '12px 16px' }}>
              <InterventionRequestDetail
                requestId={selected.item.id}
                onTransitionDone={retry}
              />
            </div>
          ) : (
            <DetailPanel situation={selected?.type === 'situation' ? selected.item : null} />
          )}
        </div>
      </div>
    </>
  );
}
