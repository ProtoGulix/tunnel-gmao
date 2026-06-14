import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Flex, IconButton, Select, Spinner, Text, TextField } from '@radix-ui/themes';
import { Plus, User, X } from 'lucide-react';
import { createInterventionTask } from '@/api/interventionTasks';
import { fetchActiveUsers } from '@/api/planning';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

/* ── Cache users module-level ───────────────────────────────────────────── */

let _usersCache = null;

export function useUsers() {
  const [users, setUsers] = useState(_usersCache ?? []);
  useEffect(() => {
    if (_usersCache) return;
    fetchActiveUsers().then((u) => { _usersCache = u; setUsers(u); }).catch(() => {});
  }, []);
  return users;
}

/* ── GhostCreateRow ─────────────────────────────────────────────────────── */

export default function GhostCreateRow({ interventionId, users, onCreated }) {
  const [active, setActive] = useState(false);
  const [label, setLabel] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const labelRef = useRef(null);

  const reset = () => { setLabel(''); setAssignedTo(''); setDueDate(''); setError(null); };

  useEffect(() => {
    if (active) setTimeout(() => labelRef.current?.focus(), 0);
  }, [active]);

  const handleCreate = useCallback(async () => {
    if (!label.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createInterventionTask({
        intervention_id: interventionId,
        label: label.trim(),
        origin: 'tech',
        ...(assignedTo && { assigned_to: assignedTo }),
        ...(dueDate && { due_date: dueDate }),
      });
      reset();
      setActive(false);
      onCreated(created);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Erreur lors de la création'));
    } finally {
      setSaving(false);
    }
  }, [interventionId, label, assignedTo, dueDate, saving, onCreated]);

  if (!active) {
    return (
      <Flex
        gap="2" px="3" py="2" align="center"
        onClick={() => setActive(true)}
        style={{ cursor: 'text', borderTop: '1px solid var(--gray-3)', userSelect: 'none', opacity: 0.5 }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.background = 'var(--gray-2)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.background = ''; }}
      >
        <Plus size={12} color="var(--blue-9)" style={{ flexShrink: 0 }} />
        <Text size="1" style={{ fontStyle: 'italic', color: 'var(--gray-9)' }}>Ajouter une tâche…</Text>
      </Flex>
    );
  }

  return (
    <Box style={{ borderTop: '1px solid var(--blue-5)', background: 'var(--blue-2)' }}>
      <Flex gap="2" px="2" py="2" align="center">
        <TextField.Root
          ref={labelRef}
          size="1"
          placeholder="Libellé de la tâche…"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && label.trim()) { e.preventDefault(); handleCreate(); }
            if (e.key === 'Escape') { reset(); setActive(false); }
          }}
          style={{ flex: 1, minWidth: 0 }}
        />

        <Select.Root value={assignedTo || '__none__'} onValueChange={(v) => setAssignedTo(v === '__none__' ? '' : v)} size="1">
          <Select.Trigger
            style={{ flexShrink: 0, minWidth: 90, maxWidth: 130 }}
          >
            {assignedTo ? (
              <Flex align="center" gap="1">
                <User size={10} />
                <Text size="1">{
                  (() => {
                    const u = users.find((u) => String(u.id) === assignedTo);
                    return u ? (u.initials || u.initial || `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`).toUpperCase() : '…';
                  })()
                }</Text>
              </Flex>
            ) : (
              <Flex align="center" gap="1">
                <User size={10} color="var(--gray-8)" />
                <Text size="1" color="gray">Assigné</Text>
              </Flex>
            )}
          </Select.Trigger>
          <Select.Content>
            <Select.Item value="__none__">Non assigné</Select.Item>
            {users.map((u) => {
              const initials = (u.initials || u.initial || `${u.first_name?.[0] ?? ''}${u.last_name?.[0] ?? ''}`).toUpperCase();
              const name = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim();
              return (
                <Select.Item key={u.id} value={String(u.id)}>
                  {initials}{name ? ` — ${name}` : ''}
                </Select.Item>
              );
            })}
          </Select.Content>
        </Select.Root>

        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          style={{
            flexShrink: 0,
            padding: '0 6px', borderRadius: 'var(--radius-2)',
            border: '1px solid var(--gray-6)',
            fontSize: 'var(--font-size-1)', fontFamily: 'inherit',
            height: 24, width: 110,
            background: 'var(--color-background)', color: dueDate ? 'var(--gray-12)' : 'var(--gray-8)',
            outline: 'none',
          }}
        />

        <Button
          size="1" color="blue" variant="soft" type="button"
          disabled={!label.trim() || saving}
          onClick={handleCreate}
          style={{ flexShrink: 0 }}
        >
          {saving ? <Spinner size="1" /> : <Plus size={11} />}
          Créer
        </Button>

        <IconButton size="1" variant="ghost" color="gray" type="button" onClick={() => { reset(); setActive(false); }} style={{ flexShrink: 0 }}>
          <X size={11} />
        </IconButton>
      </Flex>
      {error && (
        <Text size="1" color="red" style={{ display: 'block', padding: '0 10px 6px' }}>{error}</Text>
      )}
    </Box>
  );
}

GhostCreateRow.propTypes = {
  interventionId: PropTypes.string.isRequired,
  users: PropTypes.array.isRequired,
  onCreated: PropTypes.func.isRequired,
};
