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

import { useEffect, useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Box, Badge, Button, Flex, Select, Text, TextField } from '@radix-ui/themes';
import { CalendarClock, CheckSquare, Plus, User } from 'lucide-react';
import { fetchInterventionTasks } from '@/api/interventionTasks';
import { useTaskCreate } from '@/hooks/tasks/useTaskCreate';
import EntitySelectorCard from '@/components/ui/EntitySelectorCard';
import TaskCreateForm from '@/components/tasks/TaskCreateForm';

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

function normalizeSelectedTask(task, preserveExistingStatus = true) {
  if (!task) return null;
  const taskActionStatus =
    task.taskActionStatus
    ?? (preserveExistingStatus
      ? (task.status === 'done'
        ? 'done'
        : task.status === 'skipped'
          ? 'skipped'
          : task.status === 'in_progress'
            ? 'in_progress'
            : '')
      : '');

  return {
    ...task,
    taskActionStatus,
    skipReason: task.skipReason ?? task.skip_reason ?? '',
  };
}

/* ── Ligne de tâche ─────────────────────────────────────────────────────────── */

function TaskRow({ item, selectedTask, isSelected, onSelect, onTaskActionStatusChange, onSkipReasonChange, accentColor }) {
  const dueDate = item.dueDate || item.due_date || null;
  const assigneeLabel = getAssigneeLabel(item);

  return (
    <Flex
      gap="2"
      px="3"
      py="2"
      align="center"
      wrap="wrap"
      onClick={() => onSelect(item)}
      style={{
        cursor: 'pointer',
        background: isSelected ? `var(--${accentColor}-3)` : 'transparent',
        borderLeft: isSelected ? `3px solid var(--${accentColor}-9)` : '3px solid transparent',
        transition: 'background 0.1s',
        userSelect: 'none',
      }}
    >
      <CheckSquare size={13} color={isSelected ? `var(--${accentColor}-9)` : 'var(--gray-7)'} />
      <Flex direction="column" gap="1" style={{ flex: '1 1 240px', minWidth: 0 }}>
        <Text size="2" style={{ minWidth: 0 }}>{item.label}</Text>
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
      {item.status === 'in_progress' && (
        <Badge size="1" color="orange" variant="soft">En cours</Badge>
      )}
      {isSelected && selectedTask && (
        <>
          <Box onClick={(e) => e.stopPropagation()}>
            <Select.Root
              value={selectedTask.taskActionStatus || '__unset__'}
              onValueChange={(value) => onTaskActionStatusChange(item.id, value === '__unset__' ? '' : value)}
            >
              <Select.Trigger placeholder="Etat" style={{ minWidth: 140 }} />
              <Select.Content>
                <Select.Item value="__unset__">Etat...</Select.Item>
                <Select.Item value="in_progress">En cours</Select.Item>
                <Select.Item value="done">Validée</Select.Item>
                <Select.Item value="skipped">Ignorée</Select.Item>
              </Select.Content>
            </Select.Root>
          </Box>
          {!selectedTask.taskActionStatus && (
            <Text size="1" color="red">Etat requis</Text>
          )}
          {selectedTask.taskActionStatus === 'skipped' && (
            <Box style={{ flex: '1 1 220px', minWidth: 220 }} onClick={(e) => e.stopPropagation()}>
              <TextField.Root
                placeholder="Motif de l'exclusion…"
                value={selectedTask.skipReason ?? ''}
                onChange={(e) => onSkipReasonChange(item.id, e.target.value)}
              />
            </Box>
          )}
          {selectedTask.taskActionStatus === 'skipped' && !selectedTask.skipReason?.trim() && (
            <Text size="1" color="red">Motif requis</Text>
          )}
        </>
      )}
    </Flex>
  );
}

TaskRow.propTypes = {
  item: PropTypes.object.isRequired,
  selectedTask: PropTypes.object,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  onTaskActionStatusChange: PropTypes.func.isRequired,
  onSkipReasonChange: PropTypes.func.isRequired,
  accentColor: PropTypes.string.isRequired,
};

/* ── Composant principal ────────────────────────────────────────────────────── */

export default function ActionTaskSection({ interventionId, value, onChange, accentColor = 'blue' }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const { formData, set, users, saving: savingCreate, errors: createErrors, reset, handleSubmit: handleCreateSubmit } = useTaskCreate({
    interventionId: String(interventionId),
    onSuccess: (createdTask) => {
      setTasks((prev) => [...prev, createdTask]);
      onChange([...selectedTasks, normalizeSelectedTask(createdTask, false)]);
      setShowCreate(false);
    },
  });

  useEffect(() => {
    if (!interventionId) return;
    setLoading(true);
    fetchInterventionTasks(String(interventionId))
      .then((all) => setTasks(all.filter((t) => t.status !== 'done')))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [interventionId]);

  const selectedTasks = useMemo(() => {
    if (Array.isArray(value)) return value.map((task) => normalizeSelectedTask(task, true)).filter(Boolean);
    return value ? [normalizeSelectedTask(value, true)].filter(Boolean) : [];
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
    onChange([...selectedTasks, normalizeSelectedTask(task, true)]);
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

  if (!interventionId) return null;

  return (
    <Box>
      <EntitySelectorCard
        title="Tâche"
        icon={CheckSquare}
        items={tasks}
        loading={loading}
        selectedId={undefined}
        onSelect={handleToggle}
        renderRow={(item, _isSelected, onSelect) => (
          <TaskRow
            key={item.id}
            item={item}
            selectedTask={selectedTasks.find((task) => String(task.id) === String(item.id))}
            isSelected={isSelectedTask(item)}
            onSelect={onSelect}
            onTaskActionStatusChange={handleTaskActionStatusChange}
            onSkipReasonChange={handleSkipReasonChange}
            accentColor={accentColor}
          />
        )}
        onCreateClick={() => { reset(); setShowCreate((v) => !v); }}
        createLabel="Nouvelle tâche"
        emptyMessage="Aucune tâche ouverte — créez-en une"
        maxHeight={200}
      />

      {showCreate && (
        <Box mt="2">
          <TaskCreateForm
            formData={formData}
            set={set}
            users={users}
            saving={savingCreate}
            errors={createErrors}
            onSubmit={handleCreateSubmit}
            onCancel={() => { reset(); setShowCreate(false); }}
            interventionId={String(interventionId)}
            interventionLabel="Intervention fixée"
            embedded
            size="1"
          />
        </Box>
      )}
    </Box>
  );
}

ActionTaskSection.displayName = 'ActionTaskSection';

ActionTaskSection.propTypes = {
  interventionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
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
