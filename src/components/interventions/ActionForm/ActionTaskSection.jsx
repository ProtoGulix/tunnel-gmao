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
import { Box, Button, Card, Flex, Select, Spinner, Text, TextField, Badge } from '@radix-ui/themes';
import { CheckSquare, Plus } from 'lucide-react';
import { fetchInterventionTasks } from '@/api/interventionTasks';
import { useTaskCreate } from '@/hooks/tasks/useTaskCreate';
import EntitySelectorCard from '@/components/ui/EntitySelectorCard';

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
      <Text size="2" style={{ flex: '1 1 240px', minWidth: 0 }}>{item.label}</Text>
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
    onChange([...selectedTasks, normalizeSelectedTask(task, false)]);
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

  const handleCreate = useCallback((createdTask) => {
    setTasks((prev) => [...prev, createdTask]);
    onChange([...selectedTasks, normalizeSelectedTask(createdTask, false)]);
  }, [onChange, selectedTasks]);

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
        <Card mt="2" style={{ backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)' }}>
          <form onSubmit={handleCreateSubmit}>
            <Flex direction="column" gap="2">
              {createErrors.length > 0 && (
                <Box style={{ background: 'var(--red-3)', border: '1px solid var(--red-7)', borderRadius: 6, padding: 8 }}>
                  {createErrors.map((err, idx) => (
                    <Text key={idx} as="div" color="red" size="1">• {err}</Text>
                  ))}
                </Box>
              )}

              <Box>
                <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>
                  Libellé <Text color="red">*</Text>
                </Text>
                <TextField.Root
                  value={formData.label}
                  onChange={(e) => set('label', e.target.value)}
                  placeholder="Ex : Contrôle alignement capteur"
                  autoFocus
                />
              </Box>

              <Box>
                <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>Assigné à</Text>
                <Select.Root
                  value={formData.assignedTo || '__none__'}
                  onValueChange={(v) => set('assignedTo', v === '__none__' ? '' : v)}
                >
                  <Select.Trigger placeholder="Non assigné" style={{ width: '100%' }} />
                  <Select.Content>
                    <Select.Item value="__none__">Non assigné</Select.Item>
                    {users.map((u) => {
                      const initials = (u.initials || u.initial || '').toUpperCase();
                      const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
                      return (
                        <Select.Item key={u.id} value={String(u.id)}>
                          {initials ? `${initials} — ${fullName}` : fullName}
                        </Select.Item>
                      );
                    })}
                  </Select.Content>
                </Select.Root>
              </Box>

              <Flex justify="end" gap="2" mt="1">
                <Button
                  type="button"
                  variant="soft"
                  color="gray"
                  size="1"
                  onClick={() => { reset(); setShowCreate(false); }}
                >
                  Annuler
                </Button>
                <Button type="submit" color="blue" size="1" disabled={savingCreate}>
                  {savingCreate ? <Spinner size="1" /> : <Plus size={12} />}
                  Enregistrer
                </Button>
              </Flex>
            </Flex>
          </form>
        </Card>
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
