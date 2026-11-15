/**
 * TaskDueDateCell : échéance d'une tâche modifiable sur place.
 * `readOnly` affiche la date sans possibilité de modifier.
 * `onError(message)` reçoit le message de l'API en cas d'échec (ADR 0015).
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Text } from '@radix-ui/themes';
import { patchInterventionTask } from '@/api/interventionTasks';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';
import { formatDue } from './taskUtils';

const INPUT_STYLE = {
  flexShrink: 0, fontSize: 11, padding: '1px 4px', borderRadius: 4,
  border: '1px solid var(--accent-8)', background: 'var(--color-background)',
  color: 'var(--gray-12)', outline: 'none',
};

function DueDisplay({ value, overdue, readOnly }) {
  if (overdue) return <Badge color="red" variant="solid" size="1">{formatDue(value)}</Badge>;
  if (value) return <Text size="1" color="gray" style={{ whiteSpace: 'nowrap' }}>{formatDue(value)}</Text>;
  if (readOnly) return null;
  return <Text size="1" style={{ color: 'var(--gray-6)', whiteSpace: 'nowrap' }}>+date</Text>;
}

DueDisplay.propTypes = {
  value: PropTypes.string,
  overdue: PropTypes.bool,
  readOnly: PropTypes.bool,
};

export default function TaskDueDateCell({ taskId, value, onSaved, onError, readOnly = false }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const overdue = Boolean(value) && new Date(value) < today;

  async function commit(v) {
    if (v === (value ?? '')) { setEditing(false); return; }
    setSaving(true);
    try {
      await patchInterventionTask(taskId, { due_date: v || null });
      onSaved?.();
    } catch (err) {
      onError?.(extractApiErrorMessage(err, "Impossible de modifier l'échéance"));
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  if (editing && !readOnly) {
    return (
      <input
        autoFocus type="date"
        defaultValue={value?.slice(0, 10) ?? ''}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') setEditing(false); }}
        style={INPUT_STYLE}
      />
    );
  }

  return (
    <button
      type="button"
      disabled={saving}
      onClick={readOnly ? undefined : () => setEditing(true)}
      style={{ flexShrink: 0, background: 'none', border: 'none', padding: '1px 3px', borderRadius: 4, cursor: readOnly ? 'default' : 'pointer', display: 'flex', alignItems: 'center', opacity: saving ? 0.5 : 1 }}
    >
      <DueDisplay value={value} overdue={overdue} readOnly={readOnly} />
    </button>
  );
}

TaskDueDateCell.propTypes = {
  taskId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  value: PropTypes.string,
  onSaved: PropTypes.func,
  onError: PropTypes.func,
  readOnly: PropTypes.bool,
};
