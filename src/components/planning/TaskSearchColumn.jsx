import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Badge, Box, Button, Card, Flex, IconButton,
  Spinner, Text, TextField,
} from '@radix-ui/themes';
import {
  Ban, Calendar, Check, CheckSquare, ChevronRight,
  Search, Square, Trash2, Wrench, X,
} from 'lucide-react';
import {
  fetchInterventionTasksList,
  deleteInterventionTask,
} from '@/api/interventionTasks';
import { searchOpenInterventions } from '@/api/interventions';
import { InterventionCreatorFlow } from '@/components/planning/InterventionSelector';
import GhostCreateRow, { useUsers } from '@/components/tasks/GhostCreateRow';
import EquipementSearch from '@/components/planning/EquipementSearch';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

/* ── Constantes ─────────────────────────────────────────────────────────── */

const STATUS_COLORS = { todo: 'gray', in_progress: 'orange', done: 'green', skipped: 'red' };
const STATUS_LABELS = { todo: 'À faire', in_progress: 'En cours', done: 'Terminé', skipped: 'Ignoré' };

/* ── Hook recherche debounced ───────────────────────────────────────────── */

function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.status === b.status) return 0;
    return a.status === 'in_progress' ? -1 : 1;
  });
}

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
        const q = query.trim();
        // Chercher les interventions ouvertes + leurs tâches ouvertes en parallèle
        const [interventions, taskItems] = await Promise.all([
          searchOpenInterventions(q, { limit: 20 }),
          fetchInterventionTasksList({ q, status: 'todo,in_progress', limit: 100 }),
        ]);

        // Indexer les tâches par intervention_id
        const tasksByIv = new Map();
        for (const iv of taskItems) {
          if (Array.isArray(iv.tasks)) {
            tasksByIv.set(String(iv.id), sortTasks(iv.tasks));
          }
        }

        // Fusionner : toutes les interventions trouvées, avec leurs tâches si elles existent
        const merged = interventions.map((iv) => ({
          ...iv,
          tasks: tasksByIv.get(String(iv.id)) ?? [],
        }));

        // Ajouter les interventions qui ont des tâches mais n'ont pas été trouvées par la recherche inter
        for (const iv of taskItems) {
          if (!merged.some((m) => String(m.id) === String(iv.id)) && iv.tasks?.length > 0) {
            merged.push({
              id: String(iv.id),
              code: iv.code ?? '',
              title: iv.title ?? '',
              status_actual: iv.status_actual ?? iv.status ?? '',
              type_inter: iv.type_inter ?? 'CUR',
              priority: iv.priority ?? 'normale',
              plan_id: iv.plan_id ?? null,
              equipement: iv.equipement ?? null,
              tasks: sortTasks(iv.tasks),
            });
          }
        }

        if (!cancelledRef.current) setGroups(merged);
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

function TaskRow({ task, isSelected, selectedTask, isDisabled, onToggle, onDelete, onTaskActionStatusChange, onSkipReasonChange }) {
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const canDelete = (task.action_count ?? task.actions?.length ?? 0) === 0;

  const taskActionStatus = selectedTask?.taskActionStatus ?? 'in_progress';
  const isSkipped = isSelected && taskActionStatus === 'skipped';
  const isDone = isSelected && taskActionStatus === 'done';

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteInterventionTask(task.id);
      onDelete(task.id);
    } catch (err) {
      if (!err?.isAuditCancelled) setDeleteError(extractApiErrorMessage(err, 'Suppression impossible'));
    } finally {
      setDeleting(false);
    }
  }, [task.id, onDelete]);

  const bgColor = isSkipped ? 'var(--amber-2)' : isDone ? 'var(--green-2)' : isSelected ? 'var(--blue-3)' : 'transparent';
  const borderColor = isSkipped ? 'var(--amber-7)' : isDone ? 'var(--green-7)' : isSelected ? 'var(--blue-9)' : 'transparent';

  return (
    <Box style={{ borderTop: '1px solid var(--gray-3)' }}>
      <Flex
        gap="2" px="3" py="2" align="center"
        onClick={isDisabled ? undefined : onToggle}
        style={{
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          opacity: isDisabled ? 0.4 : 1,
          background: bgColor,
          borderLeft: `3px solid ${borderColor}`,
          transition: 'background 0.1s',
          userSelect: 'none',
        }}
      >
        <Box style={{ flexShrink: 0, color: isSkipped ? 'var(--amber-9)' : isSelected ? 'var(--blue-9)' : 'var(--gray-7)' }}>
          {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
        </Box>

        <Text size="2" style={{ flex: 1, textDecoration: isSkipped ? 'line-through' : 'none', color: isSkipped ? 'var(--gray-10)' : isDone ? 'var(--green-11)' : undefined }}>
          {task.label}
        </Text>

        {/* Badge statut tâche réelle — quand non sélectionné */}
        {!isSelected && (
          <Badge size="1" color={STATUS_COLORS[task.status] ?? 'gray'} variant="soft" style={{ flexShrink: 0 }}>
            {STATUS_LABELS[task.status] ?? task.status}
          </Badge>
        )}

        {/* Boutons taskActionStatus — état local formulaire, pas d'appel API */}
        {isSelected && (
          <Flex gap="1" align="center" onClick={(e) => e.stopPropagation()} style={{ flexShrink: 0 }}>
            {isSkipped ? (
              <Button size="1" color="amber" variant="soft" type="button"
                onClick={() => onTaskActionStatusChange(task.id, 'in_progress')}
              >
                <Ban size={11} /> Ignorée — annuler
              </Button>
            ) : isDone ? (
              <Button size="1" color="green" variant="soft" type="button"
                onClick={() => onTaskActionStatusChange(task.id, 'in_progress')}
              >
                <Check size={11} /> Terminée — annuler
              </Button>
            ) : (
              <Flex gap="1" align="center">
                <Button size="1" color="green" variant="soft" type="button"
                  onClick={() => onTaskActionStatusChange(task.id, 'done')}
                >
                  <Check size={11} /> Terminée
                </Button>
                <Button size="1" color="gray" variant="ghost" type="button"
                  onClick={() => onTaskActionStatusChange(task.id, 'skipped')}
                >
                  <Ban size={11} /> Ignorer
                </Button>
              </Flex>
            )}
            {canDelete && !deleting && (
              <IconButton size="1" variant="ghost" color="red" type="button" title="Supprimer" onClick={handleDelete}>
                <Trash2 size={12} />
              </IconButton>
            )}
            {deleting && <Spinner size="1" />}
          </Flex>
        )}
      </Flex>

      {/* Motif d'exclusion inline quand ignorée */}
      {isSkipped && (
        <Box px="3" pb="2" style={{ background: 'var(--amber-2)', borderTop: '1px solid var(--amber-4)' }}
          onClick={(e) => e.stopPropagation()}
        >
          <TextField.Root
            size="1"
            placeholder="Motif de l'exclusion…"
            value={selectedTask?.skipReason ?? ''}
            onChange={(e) => onSkipReasonChange(task.id, e.target.value)}
            style={{ marginTop: 4 }}
          />
          {!selectedTask?.skipReason?.trim() && (
            <Text size="1" color="amber" style={{ display: 'block', marginTop: 2 }}>Motif requis</Text>
          )}
        </Box>
      )}

      {/* Erreur suppression */}
      {deleteError && (
        <Flex align="center" gap="2" px="3" py="1"
          style={{ background: 'var(--red-2)', borderTop: '1px solid var(--red-4)' }}
        >
          <Text size="1" color="red" style={{ flex: 1 }}>{deleteError}</Text>
          <IconButton size="1" variant="ghost" color="red" type="button" onClick={() => setDeleteError(null)}>
            <X size={10} />
          </IconButton>
        </Flex>
      )}
    </Box>
  );
}

TaskRow.propTypes = {
  task: PropTypes.object.isRequired,
  isSelected: PropTypes.bool.isRequired,
  selectedTask: PropTypes.object,
  isDisabled: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onTaskActionStatusChange: PropTypes.func.isRequired,
  onSkipReasonChange: PropTypes.func.isRequired,
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

function InterventionGroup({ iv, selectedIds, selectedTasksMap, lockedIvId, users, onToggle, onDelete, onTaskCreated, onTaskActionStatusChange, onSkipReasonChange }) {
  return (
    <Box style={{ borderBottom: '1px solid var(--gray-4)' }}>
      <InterventionHeader iv={iv} />
      {iv.tasks.map((task) => (
        <TaskRow
          key={task.id}
          task={task}
          isSelected={selectedIds.has(task.id)}
          selectedTask={selectedTasksMap.get(task.id) ?? null}
          isDisabled={lockedIvId !== null && String(iv.id) !== String(lockedIvId)}
          onToggle={() => onToggle(task, iv)}
          onDelete={onDelete}
          onTaskActionStatusChange={onTaskActionStatusChange}
          onSkipReasonChange={onSkipReasonChange}
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
  selectedTasksMap: PropTypes.instanceOf(Map).isRequired,
  lockedIvId: PropTypes.string,
  users: PropTypes.array.isRequired,
  onToggle: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onTaskCreated: PropTypes.func.isRequired,
  onTaskActionStatusChange: PropTypes.func.isRequired,
  onSkipReasonChange: PropTypes.func.isRequired,
};

/* ── Composant principal ─────────────────────────────────────────────────── */

export default function TaskSearchColumn({
  formattedDate,
  selectedTasks,
  onTasksChange,
  onInterventionCreated,
}) {
  // Pré-remplir la recherche avec le code équipement si des tâches sont déjà sélectionnées
  const initialQuery = selectedTasks[0]?._intervention?.equipement?.code
    ?? selectedTasks[0]?._intervention?.code
    ?? '';
  const [query, setQuery] = useState(initialQuery);
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
  const selectedTasksMap = new Map(selectedTasks.map((t) => [t.id, t]));
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

  /* Changement de taskActionStatus (état local formulaire, sans appel API) */
  const handleTaskActionStatusChange = useCallback((taskId, taskActionStatus) => {
    onTasksChange(selectedTasks.map((t) =>
      t.id === taskId
        ? { ...t, taskActionStatus, ...(taskActionStatus !== 'skipped' ? { skipReason: '' } : {}) }
        : t
    ));
  }, [selectedTasks, onTasksChange]);

  /* Changement de motif d'exclusion */
  const handleSkipReasonChange = useCallback((taskId, skipReason) => {
    onTasksChange(selectedTasks.map((t) => t.id === taskId ? { ...t, skipReason } : t));
  }, [selectedTasks, onTasksChange]);

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
      {query.trim().length < 2 && localGroups.length === 0 && (
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
              selectedTasksMap={selectedTasksMap}
              lockedIvId={lockedIvId}
              users={users}
              onToggle={handleToggle}
              onDelete={handleDelete}
              onTaskCreated={handleTaskCreated}
              onTaskActionStatusChange={handleTaskActionStatusChange}
              onSkipReasonChange={handleSkipReasonChange}
            />
          ))}
        </Card>
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
