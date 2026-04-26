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
import { Box, Button, Flex, Text, TextField, Badge, Spinner } from '@radix-ui/themes';
import { CheckSquare, Plus, X } from 'lucide-react';
import { fetchInterventionTasks, createInterventionTask } from '@/api/interventionTasks';
import EntitySelectorCard from '@/components/ui/EntitySelectorCard';

/* ── Ligne de tâche ─────────────────────────────────────────────────────────── */

function TaskRow({ item, isSelected, onSelect, accentColor }) {
  return (
    <Flex
      align="center"
      gap="2"
      px="3"
      py="2"
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
      <Text size="2" style={{ flex: 1 }}>{item.label}</Text>
      {item.origin === 'plan' && (
        <Badge size="1" color="green" variant="soft">Gamme</Badge>
      )}
      {item.status === 'in_progress' && (
        <Badge size="1" color="orange" variant="soft">En cours</Badge>
      )}
    </Flex>
  );
}

TaskRow.propTypes = {
  item: PropTypes.object.isRequired,
  isSelected: PropTypes.bool.isRequired,
  onSelect: PropTypes.func.isRequired,
  accentColor: PropTypes.string.isRequired,
};

/* ── Composant principal ────────────────────────────────────────────────────── */

export default function ActionTaskSection({ interventionId, value, onChange, accentColor = 'blue' }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  useEffect(() => {
    if (!interventionId) return;
    setLoading(true);
    fetchInterventionTasks(String(interventionId))
      .then((all) => setTasks(all.filter((t) => t.status !== 'done')))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));
  }, [interventionId]);

  const selectedTasks = useMemo(() => {
    if (Array.isArray(value)) return value;
    return value ? [value] : [];
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
    onChange([...selectedTasks, task]);
  }, [selectedTasks, onChange]);

  const handleCreate = useCallback(async () => {
    if (!newLabel.trim() || !interventionId) return;
    setCreating(true);
    setCreateError(null);
    try {
      const created = await createInterventionTask({
        intervention_id: String(interventionId),
        label: newLabel.trim(),
        status: 'todo',
      });
      setTasks((prev) => [...prev, created]);
      onChange([...selectedTasks, created]);
      setShowCreate(false);
      setNewLabel('');
    } catch (err) {
      setCreateError(err?.response?.data?.detail ?? 'Erreur lors de la création');
    } finally {
      setCreating(false);
    }
  }, [newLabel, interventionId, onChange, selectedTasks]);

  const handleCancelCreate = useCallback(() => {
    setShowCreate(false);
    setNewLabel('');
    setCreateError(null);
  }, []);

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
            isSelected={isSelectedTask(item)}
            onSelect={onSelect}
            accentColor={accentColor}
          />
        )}
        onCreateClick={() => setShowCreate((v) => !v)}
        createLabel="Nouvelle tâche"
        emptyMessage="Aucune tâche ouverte — créez-en une"
        maxHeight={200}
      />

      {/* Formulaire de création inline */}
      {showCreate && (
        <Box mt="2">
          <Flex gap="2" align="center">
            <TextField.Root
              placeholder="Libellé de la tâche…"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreate(); } }}
              style={{ flex: 1 }}
              autoFocus
            />
            <Button
              size="2"
              type="button"
              onClick={handleCreate}
              disabled={!newLabel.trim() || creating}
            >
              {creating ? <Spinner size="1" /> : <Plus size={14} />}
              Créer
            </Button>
            <Button size="2" variant="soft" color="gray" type="button" onClick={handleCancelCreate}>
              <X size={14} />
            </Button>
          </Flex>
          {createError && (
            <Text size="1" color="red" mt="1">{createError}</Text>
          )}
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
