import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Flex,
  Link,
  Select,
  Separator,
  Switch,
  Text,
  TextField,
} from '@radix-ui/themes';
import { ExternalLink } from 'lucide-react';
import {
  createInterventionActionForTask,
  fetchInterventionTaskActions,
} from '@/api/interventionTasks';

const NO_ASSIGNEE = '__none__';

function detailDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDuration(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return '0.00 h';
  return `${number.toFixed(2)} h`;
}

function initialsFromAction(action) {
  const initials = action?.tech?.initials || action?.tech_initials || action?.tech?.initial;
  if (initials) return String(initials).toUpperCase();

  const first = String(action?.tech?.first_name || action?.tech?.firstName || '').trim();
  const last = String(action?.tech?.last_name || action?.tech?.lastName || '').trim();
  return `${first[0] || ''}${last[0] || ''}`.toUpperCase() || '—';
}

function CardHeader({ title }) {
  return (
    <Flex
      align="center"
      px="3"
      py="2"
      style={{
        borderBottom: '1px solid var(--gray-4)',
        background: 'var(--gray-2)',
        borderRadius: 'var(--radius-2) var(--radius-2) 0 0',
        margin: 'calc(var(--card-padding) * -1)',
        marginBottom: 'var(--space-2)',
      }}
    >
      <Text size="2" weight="medium" color="gray">{title}</Text>
    </Flex>
  );
}

CardHeader.propTypes = {
  title: PropTypes.string.isRequired,
};

function ReadOnlyRow({ label, value }) {
  return (
    <Flex align="center" gap="2" py="1">
      <Text size="1" color="gray" style={{ minWidth: 86 }}>{label}</Text>
      <Text size="2">{value || '—'}</Text>
    </Flex>
  );
}

ReadOnlyRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
};

export default function TaskDetail({ task, users, saving, onPatchTask, onRefresh }) {
  const [actions, setActions] = useState([]);
  const [loadingActions, setLoadingActions] = useState(false);

  const [editingLabel, setEditingLabel] = useState(task.label || '');
  const [editingAssignee, setEditingAssignee] = useState(task.assignedId || NO_ASSIGNEE);
  const [editingDueDate, setEditingDueDate] = useState(task.dueDate || '');
  const [editingOptional, setEditingOptional] = useState(Boolean(task.optional));

  const [validateMode, setValidateMode] = useState(false);
  const [validateDuration, setValidateDuration] = useState('0.25');

  const [skipMode, setSkipMode] = useState(false);
  const [skipReason, setSkipReason] = useState('');

  const actionButtonsDisabled = task.status === 'done' || task.status === 'skipped' || saving;

  useEffect(() => {
    setEditingLabel(task.label || '');
    setEditingAssignee(task.assignedId || NO_ASSIGNEE);
    setEditingDueDate(task.dueDate || '');
    setEditingOptional(Boolean(task.optional));
  }, [task]);

  useEffect(() => {
    let cancelled = false;

    const loadActions = async () => {
      setLoadingActions(true);
      try {
        const list = await fetchInterventionTaskActions(task.id);
        if (!cancelled) setActions(Array.isArray(list) ? list : []);
      } catch {
        if (!cancelled) setActions([]);
      } finally {
        if (!cancelled) setLoadingActions(false);
      }
    };

    loadActions();
    return () => {
      cancelled = true;
    };
  }, [task.id]);

  const assigneeOptions = useMemo(() => {
    return users.map((user) => ({
      value: String(user.id),
      label: user.initials
        ? `${String(user.initials).toUpperCase()} - ${user.first_name || ''} ${user.last_name || ''}`.trim()
        : `${user.first_name || ''} ${user.last_name || ''}`.trim(),
    }));
  }, [users]);

  const handleLabelBlur = async () => {
    const next = editingLabel.trim();
    if (!next || next === task.label) {
      setEditingLabel(task.label || '');
      return;
    }
    await onPatchTask(task.id, { label: next });
  };

  const handleAssigneeChange = async (value) => {
    setEditingAssignee(value);
    if (value === (task.assignedId || NO_ASSIGNEE)) return;
    await onPatchTask(task.id, {
      assigned_to: value === NO_ASSIGNEE ? null : value,
    });
  };

  const handleDueDateBlur = async () => {
    if ((editingDueDate || '') === (task.dueDate || '')) return;
    await onPatchTask(task.id, { due_date: editingDueDate || null });
  };

  const handleOptionalToggle = async (checked) => {
    setEditingOptional(checked);
    if (checked === Boolean(task.optional)) return;
    await onPatchTask(task.id, { optional: checked });
  };

  const handleValidate = async () => {
    const duration = Number(validateDuration || 0);
    await createInterventionActionForTask({
      intervention_id: task.interventionId || undefined,
      description: `Validation tache: ${task.label}`,
      time_spent: Number.isFinite(duration) && duration > 0 ? duration : 0.25,
      tasks: [{ task_id: task.id, close_task: true }],
    });
    setValidateMode(false);
    setValidateDuration('0.25');
    await onRefresh();
  };

  const handleSkip = async () => {
    await onPatchTask(task.id, {
      status: 'skipped',
      skip_reason: skipReason || null,
    });
    setSkipMode(false);
    setSkipReason('');
  };

  return (
    <Box p="4">
      <Flex direction="column" gap="3">
        <Box style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', alignItems: 'stretch' }}>
          <Card size="2" variant="surface" style={{ overflow: 'hidden' }}>
            <CardHeader title="Detail" />

            <Flex direction="column" gap="2">
              <Box>
                <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Label</Text>
                <TextField.Root value={editingLabel} onChange={(event) => setEditingLabel(event.target.value)} onBlur={handleLabelBlur} disabled={saving} />
              </Box>

              <Box>
                <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Assigne</Text>
                <Select.Root value={editingAssignee || NO_ASSIGNEE} onValueChange={handleAssigneeChange} disabled={saving}>
                  <Select.Trigger placeholder="Non assigne" />
                  <Select.Content>
                    <Select.Item value={NO_ASSIGNEE}>Non assigne</Select.Item>
                    {assigneeOptions.map((option) => (
                      <Select.Item key={option.value} value={option.value}>{option.label}</Select.Item>
                    ))}
                  </Select.Content>
                </Select.Root>
              </Box>

              <Box>
                <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Due date</Text>
                <TextField.Root type="date" value={editingDueDate || ''} onChange={(event) => setEditingDueDate(event.target.value)} onBlur={handleDueDateBlur} disabled={saving} />
              </Box>

              <Flex align="center" justify="between" mt="1">
                <Text size="2">Optionnelle</Text>
                <Switch checked={editingOptional} onCheckedChange={handleOptionalToggle} disabled={saving} />
              </Flex>

              <Separator size="4" />

              <ReadOnlyRow label="Cree par" value={task.createdBy?.initial || task.createdBy?.name || task.createdBy || '—'} />
              <ReadOnlyRow label="Cree le" value={detailDate(task.createdAt)} />
            </Flex>
          </Card>

          <Card size="2" variant="surface" style={{ overflow: 'hidden' }}>
            <CardHeader title="Actions liees" />

            {loadingActions ? (
              <Text size="1" color="gray">Chargement...</Text>
            ) : actions.length === 0 ? (
              <Text size="2" color="gray">Aucune action loggee sur cette tache.</Text>
            ) : (
              <Flex direction="column" gap="2">
                {actions.map((action) => (
                  <Card key={action.id || `${action.created_at}-${action.description || ''}`} size="1" variant="ghost">
                    <Flex align="start" gap="2">
                      <Avatar
                        fallback={initialsFromAction(action)}
                        radius="full"
                        size="1"
                        style={{ backgroundColor: 'var(--gray-5)', color: 'var(--gray-12)' }}
                      />
                      <Box style={{ flex: 1 }}>
                        <Flex align="center" justify="between" gap="2" wrap="wrap">
                          <Text size="1" color="gray">{detailDate(action.created_at || action.date)}</Text>
                          <Badge size="1" color="blue" variant="soft">{formatDuration(action.time_spent)}</Badge>
                        </Flex>
                        <Text
                          size="2"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {action.description || 'Sans description'}
                        </Text>
                      </Box>
                    </Flex>
                  </Card>
                ))}
              </Flex>
            )}
          </Card>

          <Card size="2" variant="surface" style={{ overflow: 'hidden' }}>
            <CardHeader title="Intervention parente" />

            <Flex direction="column" gap="2">
              <Badge size="1" color="blue" variant="soft" style={{ width: 'fit-content' }}>
                {task.interventionCode || '—'}
              </Badge>
              <Text size="2" weight="medium">{task.interventionTitle || 'Sans titre'}</Text>
              <Text size="1" color="gray">{task.equipementName || 'Machine inconnue'}</Text>
              {task.interventionId && (
                <Link href={`/interventions/${task.interventionId}`}>
                  <Flex align="center" gap="1">
                    <Text size="2">Ouvrir</Text>
                    <ExternalLink size={12} />
                  </Flex>
                </Link>
              )}
            </Flex>
          </Card>
        </Box>

        <Separator size="4" />

        <Flex direction="column" gap="2">
          <Flex gap="2" wrap="wrap">
            <Button color="green" disabled={actionButtonsDisabled} onClick={() => { setValidateMode((prev) => !prev); setSkipMode(false); }}>
              Valider
            </Button>
            <Button color="orange" disabled={actionButtonsDisabled} onClick={() => { setSkipMode((prev) => !prev); setValidateMode(false); }}>
              Ignorer
            </Button>
          </Flex>

          {validateMode && (
            <Flex align="end" gap="2" wrap="wrap">
              <Box>
                <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Duree (h)</Text>
                <TextField.Root value={validateDuration} onChange={(event) => setValidateDuration(event.target.value)} />
              </Box>
              <Button color="green" onClick={handleValidate} disabled={saving}>Enregistrer validation</Button>
            </Flex>
          )}

          {skipMode && (
            <Flex align="end" gap="2" wrap="wrap">
              <Box style={{ minWidth: 360 }}>
                <Text size="1" color="gray" mb="1" style={{ display: 'block' }}>Motif</Text>
                <TextField.Root value={skipReason} onChange={(event) => setSkipReason(event.target.value)} placeholder="Raison de l'ignorance" />
              </Box>
              <Button color="orange" onClick={handleSkip} disabled={saving}>Confirmer ignoree</Button>
            </Flex>
          )}
        </Flex>
      </Flex>
    </Box>
  );
}

TaskDetail.propTypes = {
  task: PropTypes.object.isRequired,
  users: PropTypes.arrayOf(PropTypes.object).isRequired,
  saving: PropTypes.bool,
  onPatchTask: PropTypes.func.isRequired,
  onRefresh: PropTypes.func.isRequired,
};
