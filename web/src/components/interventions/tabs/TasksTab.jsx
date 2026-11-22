/**
 * TasksTab : tâches d'une intervention (ADR 0015)
 *
 * - En haut : barre de progression de la gamme et alerte « étapes obligatoires en attente ».
 * - Puis une ligne par tâche, identique à celle de la Coordination (composants de components/tasks/).
 * - Création par la ligne « Ajouter une tâche… » (GhostCreateRow).
 * - Lecture seule si l'intervention est fermée ou sans droit de modifier les tâches.
 */

import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Callout, Flex, Separator, Text } from '@radix-ui/themes';
import { ClipboardCheck, ListTodo } from 'lucide-react';
import { usePermissions } from '@/auth/usePermissions';
import { PERM } from '@/auth/permissionCodes';
import { fetchInterventionTasks, fetchInterventionTasksProgress } from '@/api/interventionTasks';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import GhostCreateRow, { useUsers } from '@/components/tasks/GhostCreateRow';
import TaskLine from '@/components/tasks/TaskLine';
import TaskErrorNotice from '@/components/tasks/TaskErrorNotice';

/* ── Sous-composants ────────────────────────────────────────────────────────── */

function ProgressBar({ done, total }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <Box style={{ height: 6, background: 'var(--gray-4)', borderRadius: 4, overflow: 'hidden', flex: 1 }}>
      <Box style={{ height: '100%', width: `${pct}%`, background: 'var(--green-9)', transition: 'width 0.3s' }} />
    </Box>
  );
}
ProgressBar.propTypes = { done: PropTypes.number.isRequired, total: PropTypes.number.isRequired };

function GammeProgress({ progress }) {
  const pending = progress.blocking_pending ?? 0;
  return (
    <Box mb="4">
      <Flex align="center" gap="2" mb="1">
        <ClipboardCheck size={15} color="var(--green-9)" />
        <Text size="2" weight="medium" color="green">
          Gamme : {progress.done} / {progress.total} terminée(s)
        </Text>
        {progress.skipped > 0 && <Text size="1" color="gray">{progress.skipped} annulée(s)</Text>}
      </Flex>
      <Flex align="center" gap="2">
        <ProgressBar done={progress.done} total={progress.total} />
        <Text size="1" color="gray">{Math.round((progress.done / progress.total) * 100)}%</Text>
      </Flex>
      {pending > 0 && (
        <Text size="1" color="orange" mt="1">
          {pending} étape{pending > 1 ? 's' : ''} obligatoire{pending > 1 ? 's' : ''} en attente
        </Text>
      )}
      <Separator size="4" mt="3" />
    </Box>
  );
}
GammeProgress.propTypes = { progress: PropTypes.object.isRequired };

// Gamme en premier (par ordre de la gamme), puis les tâches ajoutées à la main
function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    if ((a.origin === 'plan') !== (b.origin === 'plan')) return a.origin === 'plan' ? -1 : 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
}

/* ── Composant principal ────────────────────────────────────────────────────── */

export default function TasksTab({ interventionId, isLocked = false }) {
  const { can } = usePermissions();
  const users = useUsers();

  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loadState, setLoadState] = useState('idle');
  const [loadError, setLoadError] = useState(null);
  const [taskError, setTaskError] = useState(null);

  // silent : rechargement après une modification, sans remplacer la liste par un chargement
  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoadState('loading');
    setLoadError(null);
    try {
      const [t, p] = await Promise.all([
        fetchInterventionTasks(interventionId),
        fetchInterventionTasksProgress(interventionId),
      ]);
      setTasks(Array.isArray(t) ? t : []);
      setProgress(p);
      setLoadState('idle');
    } catch (err) {
      setLoadError(err.message || 'Erreur chargement des tâches');
      setLoadState('error');
    }
  }, [interventionId]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loadState === 'loading') return <LoadingState fullscreen={false} message="Chargement des tâches…" />;
  if (loadState === 'error') return <ErrorState error={loadError} onRetry={loadData} />;

  const sorted = sortTasks(tasks);
  // Appelé après un enregistrement réussi : l'erreur précédente n'a plus lieu d'être.
  const reload = () => { setTaskError(null); loadData(true); };
  const showProgress = sorted.some((t) => t.origin === 'plan') && progress?.total > 0;
  const canCreate = !isLocked && can(PERM.interventions.createTask);

  return (
    <Box pt="3">
      {showProgress && <GammeProgress progress={progress} />}

      <TaskErrorNotice message={taskError} onClose={() => setTaskError(null)} />

      {sorted.length === 0 && (
        <Callout.Root color="gray" size="1" mb="3">
          <Callout.Icon><ListTodo size={14} /></Callout.Icon>
          <Callout.Text>Aucune tâche pour cette intervention.</Callout.Text>
        </Callout.Root>
      )}

      <Box style={{ border: '1px solid var(--gray-4)', borderRadius: 8, overflow: 'hidden' }}>
        {sorted.map((task, i) => (
          <TaskLine
            key={task.id}
            task={task}
            users={users}
            isLast={i === sorted.length - 1 && !canCreate}
            readOnly={isLocked}
            onSaved={reload}
            onStatusChange={reload}
            onDeleted={reload}
            onError={setTaskError}
          />
        ))}
        {canCreate && (
          <GhostCreateRow interventionId={String(interventionId)} users={users} onCreated={reload} />
        )}
      </Box>
    </Box>
  );
}

TasksTab.displayName = 'TasksTab';

TasksTab.propTypes = {
  interventionId: PropTypes.string.isRequired,
  isLocked: PropTypes.bool,
};
