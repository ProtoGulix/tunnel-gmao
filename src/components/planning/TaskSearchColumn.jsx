import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Badge, Box, Button, Card, Flex, IconButton,
  Select, Spinner, Text, TextField,
} from '@radix-ui/themes';
import {
  Calendar, CheckSquare, ChevronRight, Minus, Plus,
  RotateCcw, Search, Square, Trash2, User, Wrench, X,
} from 'lucide-react';
import {
  fetchInterventionTasksList,
  patchInterventionTask,
  deleteInterventionTask,
} from '@/api/interventionTasks';
import { InterventionCreatorFlow } from '@/components/planning/InterventionSelector';
import GhostCreateRow, { useUsers } from '@/components/tasks/GhostCreateRow';
import EquipementSearch from '@/components/planning/EquipementSearch';
import ActionTaskSection from '@/components/interventions/ActionForm/ActionTaskSection';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

/* ── Constantes ─────────────────────────────────────────────────────────── */

const STATUS_COLORS = { todo: 'gray', in_progress: 'orange', done: 'green', skipped: 'red' };
const STATUS_LABELS = { todo: 'À faire', in_progress: 'En cours', done: 'Terminé', skipped: 'Ignoré' };

/* ── Hook recherche debounced ───────────────────────────────────────────── */

function useTaskSearch(query) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    clearTimeout(timerRef.current);
    cancelledRef.current = false;
    if (!query || query.trim().length < 2) {
      setGroups([]);
      setLoading(false);
      return () => { cancelledRef.current = true; };
    }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const items = await fetchInterventionTasksList({
          q: query.trim(),
          status: 'todo,in_progress',
          limit: 20,
        });
        const sorted = items
          .map((iv) => ({
            ...iv,
            tasks: [...(iv.tasks ?? [])].sort((a, b) => {
              if (a.status === b.status) return 0;
              return a.status === 'in_progress' ? -1 : 1;
            }),
          }))
          .filter((iv) => iv.tasks?.length > 0);
        if (!cancelledRef.current) setGroups(sorted);
      } catch {
        if (!cancelledRef.current) setGroups([]);
      } finally {
        if (!cancelledRef.current) setLoading(false);
      }
    }, 300);
    return () => { cancelledRef.current = true; clearTimeout(timerRef.current); };
  }, [query]);

  return { groups, loading };
}

/* ── Ligne de tâche avec actions inline ─────────────────────────────────── */

function TaskRow({ task, isSelected, isDisabled, onToggle, onStatusChange, onDelete }) {
  const [mutating, setMutating] = useState(false);
  const [showSkipReason, setShowSkipReason] = useState(false);
  const [skipReason, setSkipReason] = useState('');
  const [rowError, setRowError] = useState(null);

  const canDelete = (task.action_count ?? task.actions?.length ?? 0) === 0;
  const isOpen = task.status === 'todo' || task.status === 'in_progress';
  const isClosed = task.status === 'done' || task.status === 'skipped';

  const patch = useCallback(async (payload) => {
    setMutating(true);
    setRowError(null);
    try {
      const updated = await patchInterventionTask(task.id, payload);
      onStatusChange(task.id, updated?.data ?? updated);
      return true;
    } catch (err) {
      if (!err?.isAuditCancelled) {
        setRowError(extractApiErrorMessage(err, 'Erreur'));
      }
      return false;
    } finally {
      setMutating(false);
    }
  }, [task.id, onStatusChange]);

  const handleReopen = useCallback(() => patch({ status: 'todo' }), [patch]);

  const handleSkipClick = useCallback(() => setShowSkipReason(true), []);

  const handleSkipConfirm = useCallback(async () => {
    if (!skipReason.trim()) return;
    const ok = await patch({ status: 'skipped', skip_reason: skipReason.trim() });
    if (ok) { setShowSkipReason(false); setSkipReason(''); }
  }, [patch, skipReason]);

  const handleDelete = useCallback(async () => {
    setMutating(true);
    setRowError(null);
    try {
      await deleteInterventionTask(task.id);
      onDelete(task.id);
    } catch (err) {
      if (!err?.isAuditCancelled) setRowError(extractApiErrorMessage(err, 'Suppression impossible'));
    } finally {
      setMutating(false);
    }
  }, [task.id, onDelete]);

  return (
    <Box style={{ borderTop: '1px solid var(--gray-3)' }}>
      <Flex
        gap="2" px="3" py="2" align="center"
        onClick={isDisabled ? undefined : onToggle}
        style={{
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.4 : 1,
          background: isSelected ? 'var(--blue-3)' : 'transparent',
          borderLeft: isSelected ? '3px solid var(--blue-9)' : '3px solid transparent',
          transition: 'background 0.1s',
          userSelect: 'none',
        }}
      >
        <Box style={{ flexShrink: 0, color: isSelected ? 'var(--blue-9)' : 'var(--gray-7)' }}>
          {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
        </Box>

        <Text size="2" style={{ flex: 1 }}>{task.label}</Text>

        {/* Badge statut — affiché seulement quand non sélectionné ou fermé */}
        {(!isSelected || isClosed) && (
          <Badge size="1" color={STATUS_COLORS[task.status] ?? 'gray'} variant="soft" style={{ flexShrink: 0 }}>
            {STATUS_LABELS[task.status] ?? task.status}
          </Badge>
        )}

        {/* Actions contextuelles selon statut */}
        {isSelected && !mutating && (
          <Flex gap="1" align="center" onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
            {isOpen && (
              <Button size="1" color="gray" variant="soft" type="button" onClick={handleSkipClick}>
                <Minus size={11} /> Ignorer
              </Button>
            )}
            {isClosed && (
              <Button size="1" color="gray" variant="soft" type="button" onClick={handleReopen}>
                <RotateCcw size={11} /> Réouvrir
              </Button>
            )}
            {canDelete && (
              <IconButton size="1" variant="ghost" color="red" type="button" title="Supprimer" onClick={handleDelete}>
                <Trash2 size={12} />
              </IconButton>
            )}
          </Flex>
        )}
        {mutating && <Spinner size="1" style={{ flexShrink: 0 }} />}
      </Flex>

      {/* Erreur inline */}
      {rowError && (
        <Flex align="center" gap="2" px="3" py="1"
          style={{ background: 'var(--red-2)', borderTop: '1px solid var(--red-4)' }}
        >
          <Text size="1" color="red" style={{ flex: 1 }}>{rowError}</Text>
          <IconButton size="1" variant="ghost" color="red" type="button" onClick={() => setRowError(null)}>
            <X size={10} />
          </IconButton>
        </Flex>
      )}

      {/* Motif d'exclusion inline */}
      {showSkipReason && (
        <Box px="3" pb="2" style={{ background: 'var(--amber-2)', borderTop: '1px solid var(--amber-5)' }}>
          <Flex gap="2" align="center" mt="1">
            <TextField.Root
              size="1"
              placeholder="Motif de l'exclusion…"
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && skipReason.trim()) handleSkipConfirm();
                if (e.key === 'Escape') { setShowSkipReason(false); setSkipReason(''); }
              }}
              style={{ flex: 1 }}
              autoFocus
            />
            <Button size="1" color="orange" type="button" disabled={!skipReason.trim() || mutating} onClick={handleSkipConfirm}>
              Confirmer
            </Button>
            <IconButton size="1" variant="ghost" color="gray" type="button" onClick={() => { setShowSkipReason(false); setSkipReason(''); }}>
              <X size={11} />
            </IconButton>
          </Flex>
        </Box>
      )}
    </Box>
  );
}

TaskRow.propTypes = {
  task: PropTypes.object.isRequired,
  isSelected: PropTypes.bool.isRequired,
  isDisabled: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

/* ── Header d'intervention ──────────────────────────────────────────────── */

function InterventionHeader({ iv }) {
  const eq = iv.equipement;
  return (
    <Flex
      align="center" gap="2" px="3" py="2"
      style={{ borderBottom: '1px solid var(--gray-4)', background: 'var(--gray-2)' }}
    >
      {eq && (
        <Badge size="1" color="gray" variant="soft" style={{ fontFamily: 'monospace', flexShrink: 0 }}>
          {eq.code ?? eq.name}
        </Badge>
      )}
      <Badge size="1" color="blue" variant="soft" style={{ fontFamily: 'monospace', flexShrink: 0 }}>
        {iv.code}
      </Badge>
      <Text size="1" color="gray" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {iv.title}
      </Text>
    </Flex>
  );
}

InterventionHeader.propTypes = { iv: PropTypes.object.isRequired };

/* ── Groupe d'intervention ──────────────────────────────────────────────── */

function InterventionGroup({ iv, selectedIds, lockedIvId, users, onToggle, onStatusChange, onDelete, onTaskCreated }) {
  return (
    <Box style={{ borderBottom: '1px solid var(--gray-4)' }}>
      <InterventionHeader iv={iv} />
      {iv.tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          isSelected={selectedIds.has(task.id)}
          isDisabled={lockedIvId !== null && String(iv.id) !== String(lockedIvId)}
          onToggle={() => onToggle(task, iv)}
          onStatusChange={onStatusChange}
          onDelete={onDelete}
        />
      ))}
      <GhostCreateRow
        interventionId={iv.id}
        users={users}
        onCreated={(created) => onTaskCreated(created, iv)}
      />
    </Box>
  );
}

InterventionGroup.propTypes = {
  iv: PropTypes.object.isRequired,
  selectedIds: PropTypes.instanceOf(Set).isRequired,
  lockedIvId: PropTypes.string,
  users: PropTypes.array.isRequired,
  onToggle: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onTaskCreated: PropTypes.func.isRequired,
};

/* ── Composant principal ─────────────────────────────────────────────────── */

export default function TaskSearchColumn({
  formattedDate,
  selectedTasks,
  onTasksChange,
  onInterventionCreated,
}) {
  const [query, setQuery] = useState('');
  const [showNewIv, setShowNewIv] = useState(false);
  const [newIvEquipement, setNewIvEquipement] = useState(null);
  // Tâches affichées localement (résultats + insertions en cache)
  const [localGroups, setLocalGroups] = useState([]);
  const { groups: searchGroups, loading } = useTaskSearch(query);
  const users = useUsers();

  // Synchroniser localGroups avec les résultats de recherche (sans écraser les insertions)
  useEffect(() => {
    setLocalGroups((prev) => {
      const prevById = Object.fromEntries(prev.map((g) => [g.id, g]));
      return searchGroups.map((iv) => {
        const prevGroup = prevById[iv.id];
        // Fusionner les tâches créées localement qui ne sont pas encore dans le résultat API
        const localOnly = (prevGroup?.tasks ?? []).filter(
          (t) => t._local && !iv.tasks.some((x) => x.id === t.id)
        );
        return {
          ...iv,
          tasks: [
            ...iv.tasks,
            ...localOnly,
          ].sort((a, b) => {
            if (a.status === b.status) return 0;
            return a.status === 'in_progress' ? -1 : 1;
          }),
        };
      });
    });
  }, [searchGroups]);

  // IDs sélectionnés + intervention verrouillée
  const selectedIds = new Set(selectedTasks.map((t) => t.id));
  const lockedIvId = selectedTasks.length > 0
    ? String(selectedTasks[0]._intervention?.id ?? '')
    : null;

  /* Toggle sélection d'une tâche */
  const handleToggle = useCallback((task, intervention) => {
    const enriched = {
      ...task,
      _intervention: {
        id: intervention.id,
        code: intervention.code,
        title: intervention.title ?? '',
        status_actual: intervention.status ?? intervention.status_actual ?? null,
        type_inter: intervention.type_inter ?? null,
        plan_id: intervention.plan_id ?? null,
        equipement: intervention.equipement ?? null,
      },
    };
    const alreadySelected = selectedIds.has(task.id);
    if (alreadySelected) {
      onTasksChange(selectedTasks.filter((t) => t.id !== task.id));
    } else {
      onTasksChange([...selectedTasks, enriched]);
    }
  }, [selectedTasks, selectedIds, onTasksChange]);

  /* Mise à jour statut depuis les mutations inline */
  const handleStatusChange = useCallback((taskId, updated) => {
    // Mettre à jour localGroups
    setLocalGroups((prev) => prev.map((iv) => ({
      ...iv,
      tasks: iv.tasks.map((t) => t.id === taskId ? { ...t, ...updated } : t),
    })));
    // Mettre à jour selectedTasks si la tâche y est
    if (selectedIds.has(taskId)) {
      onTasksChange(selectedTasks.map((t) => t.id === taskId ? { ...t, ...updated } : t));
    }
  }, [selectedTasks, selectedIds, onTasksChange]);

  /* Suppression */
  const handleDelete = useCallback((taskId) => {
    setLocalGroups((prev) => prev.map((iv) => ({
      ...iv,
      tasks: iv.tasks.filter((t) => t.id !== taskId),
    })));
    if (selectedIds.has(taskId)) {
      onTasksChange(selectedTasks.filter((t) => t.id !== taskId));
    }
  }, [selectedTasks, selectedIds, onTasksChange]);

  /* Tâche créée via ghost row */
  const handleTaskCreated = useCallback((created, intervention) => {
    const withMeta = { ...created, _local: true };
    setLocalGroups((prev) => prev.map((iv) =>
      iv.id === intervention.id
        ? { ...iv, tasks: [...iv.tasks, withMeta] }
        : iv
    ));
    // Pré-sélectionner
    handleToggle(withMeta, intervention);
  }, [handleToggle]);

  /* ── Vue "Nouvelle intervention" ── */
  if (showNewIv) {
    const equipementLabel = newIvEquipement
      ? `${newIvEquipement.code ?? ''} — ${newIvEquipement.name ?? ''}`.trim()
      : '';
    return (
      <Flex direction="column" gap="3">
        <Flex align="center" gap="2">
          <Calendar size={16} color="var(--blue-9)" />
          <Text size="3" weight="bold" style={{ textTransform: 'capitalize' }}>{formattedDate}</Text>
        </Flex>
        <Button size="1" variant="ghost" color="gray" type="button"
          onClick={() => { setShowNewIv(false); setNewIvEquipement(null); }}>
          ← Retour
        </Button>
        {!newIvEquipement ? (
          <Flex direction="column" gap="2">
            <Text size="2" color="gray">Quel équipement est concerné ?</Text>
            <EquipementSearch value={null} onChange={setNewIvEquipement} placeholder="Équipement concerné…" />
          </Flex>
        ) : (
          <InterventionCreatorFlow
            equipementId={newIvEquipement.id}
            equipementLabel={equipementLabel}
            onCreated={(created) => { setShowNewIv(false); setNewIvEquipement(null); onInterventionCreated(created); }}
            onCancel={() => setShowNewIv(false)}
          />
        )}
      </Flex>
    );
  }

  /* ── Vue principale ── */
  return (
    <Flex direction="column" gap="3">
      <Flex align="center" gap="2">
        <Calendar size={16} color="var(--blue-9)" />
        <Text size="3" weight="bold" style={{ textTransform: 'capitalize' }}>{formattedDate}</Text>
      </Flex>

      {/* Quand des tâches sont sélectionnées : section tâches de l'action */}
      {selectedTasks.length > 0 ? (
        <ActionTaskSection
          interventionId={lockedIvId}
          value={selectedTasks}
          onChange={onTasksChange}
        />
      ) : (
        <>
          <TextField.Root
            size="2"
            placeholder="Chercher une tâche, équipement, intervention…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          >
            <TextField.Slot><Search size={14} color="var(--gray-9)" /></TextField.Slot>
            {loading && <TextField.Slot side="right"><Spinner size="1" /></TextField.Slot>}
          </TextField.Root>

          {/* État vide avant frappe */}
          {query.trim().length < 2 && (
            <Flex direction="column" align="center" justify="center" gap="2"
              style={{ minHeight: 100, border: '1px dashed var(--gray-5)', borderRadius: 'var(--radius-2)', background: 'var(--gray-1)', padding: '1.5rem' }}
            >
              <Search size={18} color="var(--gray-7)" />
              <Text size="2" color="gray" align="center">
                Tapez le nom d'une tâche, d'un équipement ou d'une intervention
              </Text>
            </Flex>
          )}

          {/* Aucun résultat */}
          {query.trim().length >= 2 && !loading && localGroups.length === 0 && (
            <Flex direction="column" align="center" gap="2"
              style={{ padding: '1.5rem', border: '1px dashed var(--gray-5)', borderRadius: 'var(--radius-2)', background: 'var(--gray-1)' }}
            >
              <Text size="2" color="gray" align="center">Aucune tâche trouvée</Text>
            </Flex>
          )}

          {/* Résultats */}
          {localGroups.length > 0 && (
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              {localGroups.map((iv) => (
                <InterventionGroup
                  key={iv.id}
                  iv={iv}
                  selectedIds={selectedIds}
                  lockedIvId={lockedIvId}
                  users={users}
                  onToggle={handleToggle}
                  onStatusChange={handleStatusChange}
                  onDelete={handleDelete}
                  onTaskCreated={handleTaskCreated}
                />
              ))}
            </Card>
          )}
        </>
      )}

      {/* Nouvelle intervention via DI */}
      <Card style={{ cursor: 'pointer', padding: '10px 14px' }} onClick={() => setShowNewIv(true)}>
        <Flex align="center" gap="2">
          <Wrench size={15} color="var(--green-9)" />
          <Flex direction="column" gap="0" style={{ flex: 1 }}>
            <Text size="2" weight="bold">Nouvelle intervention</Text>
            <Text size="1" color="gray">Créer via DI (flow complet)</Text>
          </Flex>
          <ChevronRight size={13} color="var(--gray-8)" />
        </Flex>
      </Card>
    </Flex>
  );
}

TaskSearchColumn.propTypes = {
  formattedDate: PropTypes.string,
  selectedTasks: PropTypes.array.isRequired,
  onTasksChange: PropTypes.func.isRequired,
  onInterventionCreated: PropTypes.func.isRequired,
};
