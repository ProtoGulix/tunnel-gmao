/**
 * TaskAssignCell : affectation d'une tâche modifiable sur place (initiales, puis liste).
 * `readOnly` affiche les initiales sans possibilité de modifier.
 * `onError(message)` reçoit le message de l'API en cas d'échec (ADR 0015).
 */

import { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Text } from '@radix-ui/themes';
import { patchInterventionTask } from '@/api/interventionTasks';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';
import { deriveInitials, userFullName } from './taskUtils';

const SELECT_STYLE = {
  flexShrink: 0, fontSize: 11, padding: '1px 4px', borderRadius: 4,
  border: '1px solid var(--accent-8)', background: 'var(--color-background)',
  color: 'var(--gray-12)', outline: 'none', maxWidth: 140,
};

function AssignSelect({ currentId, users, onCommit, onCancel }) {
  return (
    <select
      autoFocus defaultValue={currentId}
      onBlur={(e) => onCommit(e.target.value)}
      onChange={(e) => onCommit(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Escape') onCancel(); }}
      style={SELECT_STYLE}
    >
      <option value="">Non assigné</option>
      {users.map((u) => <option key={u.id} value={String(u.id)}>{userFullName(u)}</option>)}
    </select>
  );
}

AssignSelect.propTypes = {
  currentId: PropTypes.string.isRequired,
  users: PropTypes.array.isRequired,
  onCommit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

const BUTTON_STYLE = {
  flexShrink: 0, border: '1px solid', borderRadius: '50%', width: 22, height: 22,
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
};
const ASSIGNED_COLORS = { background: 'var(--accent-4)', borderColor: 'var(--accent-6)', color: 'var(--accent-11)' };
const FREE_COLORS = { background: 'var(--gray-3)', borderColor: 'var(--gray-5)', color: 'var(--gray-9)' };

function AssignButton({ assignedTo, saving, readOnly, onEdit }) {
  const initials = deriveInitials(assignedTo);
  const name = initials ? userFullName(assignedTo) : 'Non assigné';
  const { color, ...colors } = initials ? ASSIGNED_COLORS : FREE_COLORS;
  const style = { ...BUTTON_STYLE, ...colors, cursor: readOnly ? 'default' : 'pointer', opacity: saving ? 0.5 : 1 };
  return (
    <button
      type="button"
      disabled={saving}
      title={readOnly ? name : `${name} - modifier`}
      onClick={readOnly ? undefined : onEdit}
      style={style}
    >
      <Text size="1" weight="bold" style={{ color, fontSize: 9, lineHeight: 1 }}>
        {initials || (readOnly ? '' : '+')}
      </Text>
    </button>
  );
}

AssignButton.propTypes = {
  assignedTo: PropTypes.object,
  saving: PropTypes.bool,
  readOnly: PropTypes.bool,
  onEdit: PropTypes.func.isRequired,
};

export default function TaskAssignCell({ taskId, assignedTo, users, onSaved, onError, readOnly = false }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const committing = useRef(false);
  const currentId = String(assignedTo?.id ?? '');

  // Le select appelle commit au changement puis à la perte du focus : un seul envoi.
  async function commit(v) {
    if (committing.current) return;
    if (v === currentId) { setEditing(false); return; }
    committing.current = true;
    setSaving(true);
    try {
      await patchInterventionTask(taskId, { assigned_to: v || null });
      onSaved?.();
    } catch (err) {
      onError?.(extractApiErrorMessage(err, "Impossible de modifier l'affectation"));
    } finally {
      committing.current = false;
      setSaving(false);
      setEditing(false);
    }
  }

  if (editing && !readOnly) {
    return <AssignSelect currentId={currentId} users={users} onCommit={commit} onCancel={() => setEditing(false)} />;
  }
  return <AssignButton assignedTo={assignedTo} saving={saving} readOnly={readOnly} onEdit={() => setEditing(true)} />;
}

TaskAssignCell.propTypes = {
  taskId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  assignedTo: PropTypes.object,
  users: PropTypes.array.isRequired,
  onSaved: PropTypes.func,
  onError: PropTypes.func,
  readOnly: PropTypes.bool,
};
