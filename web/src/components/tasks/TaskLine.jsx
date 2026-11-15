/**
 * TaskLine : ligne de tâche commune à la Coordination et à l'onglet Tâches (ADR 0015).
 *
 * Barre de couleur selon le statut, statut, libellé (barré si terminé ou ignoré) et
 * badge « Optionnelle » le cas échéant,
 * boutons « Terminé » et « Annuler » toujours visibles pour RESP et ADMIN (ADR 0016),
 * autres boutons d'action au survol, affectation, échéance.
 * Lecture seule si `readOnly` (intervention fermée) ou sans droit de modifier les tâches.
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Flex, Text } from '@radix-ui/themes';
import { GroupCard } from '@/components/shared/GroupCard';
import { usePermissions } from '@/auth/usePermissions';
import { PERM } from '@/auth/permissionCodes';
import { TASK_ACCENT } from '@/config/taskConfig';
import TaskStatusBadge from './TaskStatusBadge';
import TaskAssignCell from './TaskAssignCell';
import TaskDueDateCell from './TaskDueDateCell';
import TaskActionButtons from './TaskActionButtons';
import TaskCloseButtons from './TaskCloseButtons';
import { canCloseTask, canDeleteTask, canSkipTask } from './taskUtils';

function TaskLabel({ task }) {
  const finished = task.status === 'done' || task.status === 'skipped';
  return (
    <Flex align="center" gap="2" style={{ flex: 1, minWidth: 0 }}>
      <Text
        size="1"
        title={task.skip_reason || undefined}
        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: finished ? 'line-through' : 'none', color: finished ? 'var(--gray-9)' : undefined }}
      >
        {task.label}
      </Text>
      {task.optional && (
        <Badge size="1" color="gray" variant="outline" style={{ flexShrink: 0 }}>Optionnelle</Badge>
      )}
    </Flex>
  );
}

TaskLabel.propTypes = { task: PropTypes.object.isRequired };

function useTaskRights(task, readOnly) {
  const { can, canSkipObligatory, isElevated } = usePermissions();
  return {
    locked: readOnly || !can(PERM.interventions.updateTask),
    canSkip: canSkipTask(task, canSkipObligatory),
    canDelete: canDeleteTask(task, can(PERM.interventions.removeTask)),
    canClose: canCloseTask(task.status, isElevated),
  };
}

export default function TaskLine({
  task, users, isLast = false, readOnly = false,
  onSaved, onStatusChange, onDeleted, onError,
}) {
  const [hovered, setHovered] = useState(false);
  const { locked, canSkip, canDelete, canClose } = useTaskRights(task, readOnly);
  const cellProps = { taskId: task.id, onSaved, onError, readOnly: locked };

  return (
    <GroupCard.Row
      accentColor={TASK_ACCENT[task.status] ?? 'var(--gray-6)'}
      isLast={isLast}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <TaskStatusBadge status={task.status} />
      <TaskLabel task={task} />
      {!locked && canClose && (
        <TaskCloseButtons taskId={task.id} onStatusChange={onStatusChange} onError={onError} />
      )}
      {!locked && (
        <TaskActionButtons
          taskId={task.id}
          status={task.status}
          visible={hovered}
          mode="live"
          canDelete={canDelete}
          canSkip={canSkip}
          onStatusChange={onStatusChange}
          onDeleted={onDeleted}
          onError={onError}
        />
      )}
      <TaskAssignCell {...cellProps} assignedTo={task.assigned_to ?? null} users={users} />
      <TaskDueDateCell {...cellProps} value={task.due_date} />
    </GroupCard.Row>
  );
}

TaskLine.propTypes = {
  task: PropTypes.object.isRequired,
  users: PropTypes.array.isRequired,
  isLast: PropTypes.bool,
  readOnly: PropTypes.bool,
  onSaved: PropTypes.func,
  onStatusChange: PropTypes.func,
  onDeleted: PropTypes.func,
  onError: PropTypes.func,
};
