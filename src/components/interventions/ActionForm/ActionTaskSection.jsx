/**
 * ActionTaskSection — sélecteur + créateur de tâche inline pour ActionForm
 *
 * Affiché uniquement quand l'interventionId est résolu (CUR/autres, hors gamme).
 * Principe identique au pattern EntitySelectorCard :
 *   - Liste les tâches ouvertes non-gamme de l'intervention
 *   - Sélection simple (radio) via clic sur la ligne
 *   - Création inline (POST eager → retourne l'objet tâche)
 *
 * @module components/interventions/ActionForm/ActionTaskSection
 */

import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { Box, Badge, Button, Flex, IconButton, Spinner, Text, TextField } from '@radix-ui/themes';
import { Ban, CalendarClock, CheckSquare, Plus, User, Wrench, X } from 'lucide-react';
import { fetchInterventionTasks, fetchOpenTasksByMachine } from '@/api/interventionTasks';
import { fetchOpenInterventionsByEquipement } from '@/api/planning';
import { useTaskCreate } from '@/hooks/tasks/useTaskCreate';
import EntitySelectorCard from '@/components/ui/EntitySelectorCard';

function deriveInitials(assignedTo) {
  if (!assignedTo) return '';
  if (assignedTo.initial) return String(assignedTo.initial).toUpperCase();
  if (assignedTo.initials) return String(assignedTo.initials).toUpperCase();

  const first = String(assignedTo.first_name || assignedTo.firstName || '').trim();
  const last = String(assignedTo.last_name || assignedTo.lastName || '').trim();
  return `${first[0] || ''}${last[0] || ''}`.toUpperCase();
}

function getAssigneeLabel(task) {
  const assignedTo = task.assignedTo || task.assigned_to || null;
  if (!assignedTo) return 'Non assignée';

  const fullName = `${assignedTo.first_name || assignedTo.firstName || ''} ${assignedTo.last_name || assignedTo.lastName || ''}`.trim();
  if (fullName) return fullName;

  return deriveInitials(assignedTo) || assignedTo.initial || assignedTo.initials || 'Assignée';
}

function formatDueDateFR(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function getDueDateColor(dueDate) {
  if (!dueDate) return 'gray';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diff = Math.round((due - today) / 86400000);
  if (diff < 0) return 'red';
  if (diff === 0) return 'amber';
  if (diff === 1) return 'blue';
  return 'gray';
}

function normalizeSelectedTask(task) {
  if (!task) return null;
  // taskActionStatus explicite uniquement si 'skipped' (choix volontaire du tech)
  // 'in_progress' est implicite au backend pour toute tâche liée sans close_task/skip
  const taskActionStatus = task.taskActionStatus === 'skipped' ? 'skipped' : 'in_progress';

  return {
    ...task,
    taskActionStatus,
    skipReason: task.skipReason ?? task.skip_reason ?? '',
  };
}

/* ── Ligne de tâche ─────────────────────────────────────────────────────────── */

function TaskRow({ item, selectedTask, isSelected, isDisabled, onSelect, onTaskActionStatusChange, onSkipReasonChange, accentColor }) {
  const dueDate = item.dueDate || item.due_date || null;
  const assigneeLabel = getAssigneeLabel(item);
  const isSkipped = isSelected && selectedTask?.taskActionStatus === 'skipped';

  return (
    <Flex
      gap="2"
      px="3"
      py="2"
      align="center"
      wrap="wrap"
      onClick={isDisabled ? undefined : () => onSelect(item)}
      style={{
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.4 : 1,
        background: isSkipped ? 'var(--orange-2)' : isSelected ? `var(--${accentColor}-3)` : 'transparent',
        borderLeft: isSkipped
          ? '3px solid var(--orange-7)'
          : isSelected
            ? `3px solid var(--${accentColor}-9)`
            : '3px solid transparent',
        transition: 'background 0.1s',
        userSelect: 'none',
      }}
    >
      <CheckSquare size={13} color={isSkipped ? 'var(--orange-9)' : isSelected ? `var(--${accentColor}-9)` : 'var(--gray-7)'} />
      <Flex direction="column" gap="1" style={{ flex: '1 1 240px', minWidth: 0 }}>
        <Text size="2" style={{ minWidth: 0, textDecoration: isSkipped ? 'line-through' : 'none', color: isSkipped ? 'var(--gray-10)' : undefined }}>{item.label}</Text>
        <Flex gap="2" wrap="wrap" align="center">
          <Flex gap="1" align="center">
            <User size={11} color="var(--gray-9)" />
            <Text size="1" color="gray">{assigneeLabel}</Text>
          </Flex>
          {dueDate && (
            <Badge size="1" color={getDueDateColor(dueDate)} variant={getDueDateColor(dueDate) === 'red' ? 'solid' : 'soft'}>
              <Flex gap="1" align="center">
                <CalendarClock size={10} />
                <span>{formatDueDateFR(dueDate)}</span>
              </Flex>
            </Badge>
          )}
        </Flex>
      </Flex>
      {item.origin === 'plan' && (
        <Badge size="1" color="green" variant="soft">Gamme</Badge>
      )}
      {item.status === 'in_progress' && !isSelected && (
        <Badge size="1" color="blue" variant="soft">En cours</Badge>
      )}
      {isSelected && !isSkipped && (
        <Badge size="1" color={accentColor} variant="soft">En cours</Badge>
      )}
      {isSelected && (
        <Box onClick={(e) => e.stopPropagation()}>
          {isSkipped ? (
            <Button
              size="1"
              variant="soft"
              color="orange"
              type="button"
              onClick={() => onTaskActionStatusChange(item.id, 'in_progress')}
            >
              <Ban size={11} /> Ignorée — annuler
            </Button>
          ) : (
            <Button
              size="1"
              variant="ghost"
              color="gray"
              type="button"
              onClick={() => onTaskActionStatusChange(item.id, 'skipped')}
            >
              <Ban size={11} /> Ignorer
            </Button>
          )}
        </Box>
      )}
      {isSkipped && (
        <Box style={{ flex: '1 1 220px', minWidth: 220 }} onClick={(e) => e.stopPropagation()}>
          <TextField.Root
            size="1"
            placeholder="Motif de l'exclusion…"
            value={selectedTask.skipReason ?? ''}
            onChange={(e) => onSkipReasonChange(item.id, e.target.value)}
          />
          {!selectedTask.skipReason?.trim() && (
            <Text size="1" color="orange">Motif requis</Text>
          )}
        </Box>
      )}
    </Flex>
  );
}

TaskRow.propTypes = {
  item: PropTypes.object.isRequired,
  selectedTask: PropTypes.object,
  isSelected: PropTypes.bool.isRequired,
  isDisabled: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  onTaskActionStatusChange: PropTypes.func.isRequired,
  onSkipReasonChange: PropTypes.func.isRequired,
  accentColor: PropTypes.string.isRequired,
};

/* ── Recherche d'intervention inline (mode machineId) ───────────────────── */

const IV_STATUS_COLORS = { ouvert: 'blue', en_cours: 'green', attente_pieces: 'orange', attente_prod: 'orange' };
const IV_STATUS_LABELS = { ouvert: 'Ouvert', en_cours: 'En cours', attente_pieces: 'Attente pièces', attente_prod: 'Attente prod' };

function InlineInterventionSearch({ machineId: mId, value, onChange }) {
  const [interventions, setInterventions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (!mId) return;
    let cancelled = false;
    setLoading(true);
    fetchOpenInterventionsByEquipement(mId)
      .then((d) => { if (!cancelled) setInterventions(d); })
      .catch(() => { if (!cancelled) setInterventions([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [mId]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return interventions;
    return interventions.filter((iv) => iv.code?.toLowerCase().includes(q) || iv.title?.toLowerCase().includes(q));
  }, [interventions, query]);

  if (value) {
    return (
      <Flex align="center" gap="2" style={{ padding: '5px 8px', background: 'var(--blue-3)', borderRadius: 'var(--radius-2)', border: '1px solid var(--blue-6)' }}>
        <Badge color="blue" variant="soft" size="1" style={{ fontFamily: 'monospace' }}>{value.code}</Badge>
        <Text size="1" style={{ flex: 1 }}>{value.title}</Text>
        <IconButton size="1" variant="ghost" color="gray" type="button" onClick={() => onChange(null)}><X size={11} /></IconButton>
      </Flex>
    );
  }

  return (
    <Box>
      <Box style={{ position: 'relative' }}>
        <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Choisir l'intervention…"
          style={{ width: '100%', padding: '6px 10px 6px 30px', borderRadius: 'var(--radius-2)', border: '1px solid var(--gray-7)', fontSize: 'var(--font-size-2)', fontFamily: 'inherit', boxSizing: 'border-box', height: 32, background: 'var(--color-background)', color: 'var(--gray-12)' }}
          autoComplete="off" autoFocus
        />
        <Wrench size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-9)', pointerEvents: 'none' }} />
      </Box>
      {loading && <Flex justify="center" py="1"><Spinner size="1" /></Flex>}
      {!loading && filtered.length > 0 && (
        <Box style={{ marginTop: 3, border: '1px solid var(--gray-6)', borderRadius: 'var(--radius-2)', background: 'var(--color-background)', maxHeight: 160, overflowY: 'auto', boxShadow: 'var(--shadow-3)' }}>
          {filtered.map((iv) => (
            <button key={iv.id} type="button" onClick={() => { onChange(iv); setQuery(''); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', padding: '6px 10px', border: 'none', borderBottom: '1px solid var(--gray-3)', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--gray-3)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <Badge color="blue" variant="soft" size="1" style={{ fontFamily: 'monospace', flexShrink: 0 }}>{iv.code}</Badge>
              <Text size="1" style={{ flex: 1 }}>{iv.title}</Text>
              <Badge size="1" color={IV_STATUS_COLORS[iv.status_actual] ?? 'gray'} variant="soft">{IV_STATUS_LABELS[iv.status_actual] ?? iv.status_actual}</Badge>
            </button>
          ))}
        </Box>
      )}
    </Box>
  );
}

InlineInterventionSearch.propTypes = {
  machineId: PropTypes.string.isRequired,
  value: PropTypes.object,
  onChange: PropTypes.func.isRequired,
};

/* ── Ligne de création inline ───────────────────────────────────────────────── */

function InlineCreateRow({ machineId, lockedInterventionId, createIv, setCreateIv, formData, set, saving, errors, onSubmit, onCancel, accentColor }) {
  const labelRef = useRef(null);

  // Focus auto sur le champ label dès que l'intervention est connue
  useEffect(() => {
    if (interventionOrIvReady(machineId, lockedInterventionId, createIv)) {
      labelRef.current?.focus();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createIv]);

  const interventionReady = !machineId || lockedInterventionId || createIv;

  return (
    <Flex
      gap="2"
      px="3"
      py="2"
      align="center"
      wrap="wrap"
      style={{
        borderTop: '1px solid var(--gray-4)',
        background: `var(--${accentColor}-2)`,
        borderLeft: `3px solid var(--${accentColor}-7)`,
      }}
    >
      <Plus size={13} color={`var(--${accentColor}-9)`} style={{ flexShrink: 0 }} />

      {/* Sélecteur d'intervention (mode machineId sans verrouillage) */}
      {machineId && !lockedInterventionId && (
        <Box style={{ flex: '0 0 auto', minWidth: 160, maxWidth: 220 }}>
          <InlineInterventionSearch machineId={machineId} value={createIv} onChange={setCreateIv} />
        </Box>
      )}

      {/* Champ libellé */}
      {interventionReady && (
        <Box style={{ flex: '1 1 160px', minWidth: 120 }}>
          <TextField.Root
            ref={labelRef}
            size="1"
            placeholder="Libellé de la tâche…"
            value={formData.label}
            onChange={(e) => set('label', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && formData.label.trim()) { e.preventDefault(); onSubmit(); }
              if (e.key === 'Escape') onCancel();
            }}
            autoFocus={!machineId || !!lockedInterventionId}
          />
        </Box>
      )}

      {errors.length > 0 && (
        <Text size="1" color="red" style={{ flexBasis: '100%' }}>{errors[0]}</Text>
      )}

      <Flex gap="1" align="center" style={{ flexShrink: 0 }}>
        {interventionReady && (
          <Button
            type="button" size="1" color={accentColor}
            disabled={!formData.label.trim() || saving}
            onClick={onSubmit}
          >
            {saving ? <Spinner size="1" /> : <Plus size={11} />}
            Créer
          </Button>
        )}
        <IconButton type="button" size="1" variant="ghost" color="gray" onClick={onCancel}>
          <X size={11} />
        </IconButton>
      </Flex>
    </Flex>
  );
}

function interventionOrIvReady(machineId, lockedInterventionId, createIv) {
  return !machineId || !!lockedInterventionId || !!createIv;
}

InlineCreateRow.propTypes = {
  machineId: PropTypes.string,
  lockedInterventionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  createIv: PropTypes.object,
  setCreateIv: PropTypes.func.isRequired,
  formData: PropTypes.object.isRequired,
  set: PropTypes.func.isRequired,
  saving: PropTypes.bool,
  errors: PropTypes.array,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  accentColor: PropTypes.string.isRequired,
};

/* ── Composant principal ────────────────────────────────────────────────────── */

export default function ActionTaskSection({ interventionId, machineId, value, onChange, accentColor = 'blue' }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  // En mode machineId : intervention choisie pour la création (persiste pour enchaîner)
  const [createIv, setCreateIv] = useState(null);

  // Calculé avant useTaskCreate pour pouvoir l'utiliser comme interventionId de création
  const firstValue = Array.isArray(value) ? value[0] : value;
  const lockedInterventionId = machineId && firstValue
    ? (firstValue._intervention?.id ?? firstValue.intervention_id ?? null)
    : null;

  const createInterventionId = interventionId
    ? String(interventionId)
    : (createIv?.id ? String(createIv.id) : (lockedInterventionId ? String(lockedInterventionId) : null));

  const { formData, set, users, saving: savingCreate, errors: createErrors, reset, handleSubmit: handleCreateSubmit } = useTaskCreate({
    interventionId: createInterventionId,
    onSuccess: (createdTask) => {
      // En mode machineId : attacher ._intervention pour le verrouillage
      const ivSource = createIv ?? null;
      const ivForTask = ivSource
        ? { id: ivSource.id, code: ivSource.code, title: ivSource.title ?? '', status_actual: ivSource.status_actual, type_inter: ivSource.type_inter ?? null, plan_id: ivSource.plan_id ?? null }
        : null;
      const enriched = ivForTask ? { ...createdTask, _intervention: ivForTask } : createdTask;
      setTasks((prev) => [...prev, enriched]);
      onChange([...selectedTasks, normalizeSelectedTask(enriched)]);
      // Reset le libellé mais garder l'intervention pour enchaîner (seulement en mode machineId)
      if (machineId) {
        reset();
        // Garder showCreate ouvert + createIv pour enchaîner une 2e tâche
      } else {
        reset();
        setShowCreate(false);
      }
    },
  });

  useEffect(() => {
    if (machineId) {
      setLoading(true);
      fetchOpenTasksByMachine(machineId)
        .then((all) => setTasks(all.filter((t) => t.status !== 'done' && t.status !== 'skipped')))
        .catch(() => setTasks([]))
        .finally(() => setLoading(false));
      return;
    }
    if (!interventionId) return;
    setLoading(true);
    fetchInterventionTasks(String(interventionId))
      .then((all) => setTasks(all.filter((t) => t.status !== 'done' && t.status !== 'skipped')))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [interventionId, machineId]);

  const selectedTasks = useMemo(() => {
    if (Array.isArray(value)) return value.map((task) => normalizeSelectedTask(task)).filter(Boolean);
    return value ? [normalizeSelectedTask(value)].filter(Boolean) : [];
  }, [value]);

  const isSelectedTask = useCallback(
    (task) => selectedTasks.some((t) => String(t.id) === String(task.id)),
    [selectedTasks]
  );

  const handleToggle = useCallback((task) => {
    const exists = selectedTasks.some((t) => String(t.id) === String(task.id));
    if (exists) {
      onChange(selectedTasks.filter((t) => String(t.id) !== String(task.id)));
      return;
    }
    onChange([...selectedTasks, normalizeSelectedTask(task)]);
  }, [selectedTasks, onChange]);

  const handleTaskActionStatusChange = useCallback((taskId, taskActionStatus) => {
    onChange(selectedTasks.map((task) => (
      String(task.id) === String(taskId)
        ? {
            ...task,
            taskActionStatus,
            ...(taskActionStatus !== 'skipped' ? { skipReason: '' } : {}),
          }
        : task
    )));
  }, [selectedTasks, onChange]);

  const handleSkipReasonChange = useCallback((taskId, skipReason) => {
    onChange(selectedTasks.map((task) => (
      String(task.id) === String(taskId)
        ? { ...task, skipReason }
        : task
    )));
  }, [selectedTasks, onChange]);

  if (!interventionId && !machineId) return null;

  return (
    <Box>
      <EntitySelectorCard
        title="Tâche"
        icon={CheckSquare}
        items={tasks}
        loading={loading}
        selectedId={undefined}
        onSelect={handleToggle}
        renderRow={(item, _isSelected, onSelect) => {
          const itemIvId = item._intervention?.id ?? item.intervention_id ?? null;
          const isDisabled = lockedInterventionId !== null && itemIvId !== null
            && String(itemIvId) !== String(lockedInterventionId);
          return (
            <TaskRow
              key={item.id}
              item={item}
              selectedTask={selectedTasks.find((task) => String(task.id) === String(item.id))}
              isSelected={isSelectedTask(item)}
              isDisabled={isDisabled}
              onSelect={onSelect}
              onTaskActionStatusChange={handleTaskActionStatusChange}
              onSkipReasonChange={handleSkipReasonChange}
              accentColor={accentColor}
            />
          );
        }}
        onCreateClick={(interventionId || lockedInterventionId || machineId) ? () => { reset(); setCreateIv(null); setShowCreate((v) => !v); } : undefined}
        createLabel="Nouvelle tâche"
        emptyMessage="Aucune tâche ouverte — créez-en une"
        maxHeight={200}
        renderInlineCreate={showCreate ? () => (
          <InlineCreateRow
            machineId={machineId}
            lockedInterventionId={lockedInterventionId}
            createIv={createIv}
            setCreateIv={setCreateIv}
            formData={formData}
            set={set}
            saving={savingCreate}
            errors={createErrors}
            onSubmit={handleCreateSubmit}
            onCancel={() => { reset(); setCreateIv(null); setShowCreate(false); }}
            accentColor={accentColor}
          />
        ) : undefined}
      />
    </Box>
  );
}

ActionTaskSection.displayName = 'ActionTaskSection';

ActionTaskSection.propTypes = {
  interventionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  machineId: PropTypes.string,
  value: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      status: PropTypes.string,
      origin: PropTypes.string,
    })),
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
      status: PropTypes.string,
      origin: PropTypes.string,
    }),
  ]),
  onChange: PropTypes.func.isRequired,
  accentColor: PropTypes.string,
};
