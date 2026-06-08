/**
 * TasksTab — liste unifiée de toutes les tâches d'une intervention
 *
 * Remplace l'ancien onglet Gamme.
 * - Toujours visible (pas de condition sur plan_id)
 * - Affiche toutes les tâches (origin=plan + manuelles)
 * - Badge d'origine : Gamme (vert) | Manuelle (gris)
 * - Barre de progression pour les tâches Gamme
 * - Formulaire de création inline de tâches manuelles
 * - Action Ignorer sur les tâches Gamme obligatoires (RESP/ADMIN)
 */

import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Badge, Box, Button, Callout, Dialog, Flex, Separator, Text, TextField,
} from '@radix-ui/themes';
import { AlertCircle, CheckCircle2, Circle, ClipboardCheck, ListTodo, MinusCircle, Plus } from 'lucide-react';
import { usePermissions } from '@/auth/usePermissions';
import {
  fetchInterventionTasks,
  fetchInterventionTasksProgress,
  patchInterventionTask,
} from '@/api/interventionTasks';
import { useTaskCreate } from '@/hooks/tasks/useTaskCreate';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import TaskCreateForm from '@/components/tasks/TaskCreateForm';
import { TASK_STATUS_LABEL, TASK_STATUS_COLOR } from '@/config/taskConfig';

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

function TaskIcon({ status, optional }) {
  if (status === 'done') return <CheckCircle2 size={15} color="var(--green-9)" />;
  if (status === 'skipped') return <MinusCircle size={15} color="var(--orange-9)" />;
  if (optional) return <Circle size={15} color="var(--gray-6)" />;
  return <AlertCircle size={15} color="var(--orange-9)" />;
}
TaskIcon.propTypes = { status: PropTypes.string.isRequired, optional: PropTypes.bool };

function TaskRow({ task, onSkipOpen, saving, canSkipObligatory, isLocked }) {
  const isPending = task.status === 'todo' || task.status === 'in_progress';
  const isSaving = saving === task.id;
  const isGamme = task.origin === 'plan';
  const showSkip = isGamme && isPending && (task.optional || canSkipObligatory) && !isLocked;

  return (
    <Flex align="center" gap="2" py="2" style={{ borderBottom: '1px solid var(--gray-3)' }}>
      <TaskIcon status={task.status} optional={task.optional} />
      <Box style={{ flex: 1 }}>
        <Flex align="center" gap="2" wrap="wrap">
          <Text
            size="2"
            weight={isPending ? 'regular' : 'medium'}
            color={task.optional && isPending ? 'gray' : undefined}
            style={task.optional ? { fontStyle: 'italic' } : undefined}
          >
            {task.label}
          </Text>
          <Badge size="1" color={isGamme ? 'green' : 'gray'} variant="soft">
            {isGamme ? 'Gamme' : 'Manuelle'}
          </Badge>
          {task.optional && <Badge color="gray" variant="outline" size="1">Optionnelle</Badge>}
        </Flex>
        {task.skip_reason && <Text size="1" color="orange">{task.skip_reason}</Text>}
        {task.updated_at && task.status === 'done' && (
          <Text size="1" color="gray">{new Date(task.updated_at).toLocaleDateString('fr-FR')}</Text>
        )}
      </Box>
      <Badge color={TASK_STATUS_COLOR[task.status] || 'gray'} variant="soft" size="1">
        {TASK_STATUS_LABEL[task.status] || task.status}
      </Badge>
      {showSkip && (
        <Button size="1" color="orange" variant="ghost" disabled={isSaving} onClick={() => onSkipOpen(task)}>
          Ignorer
        </Button>
      )}
    </Flex>
  );
}
TaskRow.propTypes = {
  task: PropTypes.object.isRequired,
  onSkipOpen: PropTypes.func.isRequired,
  saving: PropTypes.string,
  canSkipObligatory: PropTypes.bool,
  isLocked: PropTypes.bool,
};

/* ── Composant principal ────────────────────────────────────────────────────── */

export default function TasksTab({ interventionId, isLocked = false }) {
  const { canSkipObligatory } = usePermissions();

  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loadState, setLoadState] = useState('idle');
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(null);
  const [skipTarget, setSkipTarget] = useState(null);
  const [skipReason, setSkipReason] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const { formData, set, users, saving: savingCreate, errors: createErrors, reset, handleSubmit: handleCreateSubmit } = useTaskCreate({
    interventionId: String(interventionId),
    onSuccess: () => { setShowCreate(false); loadData(); },
  });

  const loadData = useCallback(async () => {
    setLoadState('loading');
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

  const handleSkip = async () => {
    if (!skipTarget) return;
    try {
      setSaving(skipTarget.id);
      await patchInterventionTask(skipTarget.id, {
        status: 'skipped',
        skip_reason: skipReason || null,
      });
      await loadData();
    } finally {
      setSaving(null);
      setSkipTarget(null);
      setSkipReason('');
    }
  };

  if (loadState === 'loading') return <LoadingState fullscreen={false} message="Chargement des tâches…" />;
  if (loadState === 'error') return <ErrorState error={loadError} onRetry={loadData} />;

  const gammeTasks = [...tasks]
    .filter((t) => t.origin === 'plan')
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const manualTasks = tasks.filter((t) => t.origin !== 'plan');

  const hasGamme = gammeTasks.length > 0;
  const hasTasks = tasks.length > 0;

  return (
    <Box pt="3">

      {/* ── Barre de progression Gamme ── */}
      {hasGamme && progress && progress.total > 0 && (
        <Box mb="4">
          <Flex align="center" gap="2" mb="1">
            <ClipboardCheck size={15} color="var(--green-9)" />
            <Text size="2" weight="medium" color="green">
              Gamme — {progress.done} / {progress.total} validée(s)
            </Text>
            {progress.skipped > 0 && (
              <Text size="1" color="gray">· {progress.skipped} ignorée(s)</Text>
            )}
          </Flex>
          <Flex align="center" gap="2">
            <ProgressBar done={progress.done} total={progress.total} />
            <Text size="1" color="gray">{Math.round((progress.done / progress.total) * 100)}%</Text>
          </Flex>
          {(progress.blocking_pending ?? 0) > 0 && (
            <Text size="1" color="orange" mt="1">
              ⚠ {progress.blocking_pending} étape{progress.blocking_pending > 1 ? 's' : ''} obligatoire{progress.blocking_pending > 1 ? 's' : ''} en attente
            </Text>
          )}
          <Separator size="4" mt="3" />
        </Box>
      )}

      {/* ── Liste unifiée ── */}
      {hasTasks ? (
        tasks
          .sort((a, b) => {
            // Gamme en premier, puis manuelles ; dans chaque groupe par sort_order / id
            if (a.origin === 'plan' && b.origin !== 'plan') return -1;
            if (a.origin !== 'plan' && b.origin === 'plan') return 1;
            return (a.sort_order ?? 0) - (b.sort_order ?? 0);
          })
          .map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onSkipOpen={(t) => { setSkipTarget(t); setSkipReason(''); }}
              saving={saving}
              canSkipObligatory={canSkipObligatory}
              isLocked={isLocked}
            />
          ))
      ) : (
        <Callout.Root color="gray" size="1" mb="3">
          <Callout.Icon><ListTodo size={14} /></Callout.Icon>
          <Callout.Text>Aucune tâche pour cette intervention.</Callout.Text>
        </Callout.Root>
      )}

      {/* ── Création inline ── */}
      {!isLocked && (
        <Box mt="3">
          {showCreate ? (
            <TaskCreateForm
              formData={formData}
              set={set}
              users={users}
              saving={savingCreate}
              errors={createErrors}
              onSubmit={handleCreateSubmit}
              onCancel={() => { reset(); setShowCreate(false); }}
              interventionId={String(interventionId)}
              interventionLabel="Intervention fixée"
            />
          ) : (
            <Button size="2" variant="soft" color="gray" onClick={() => setShowCreate(true)}>
              <Plus size={14} />
              Nouvelle tâche
            </Button>
          )}
        </Box>
      )}

      {/* ── Dialog Ignorer ── */}
      <Dialog.Root
        open={!!skipTarget}
        onOpenChange={(open) => {
          if (!open) {
            setSkipTarget(null);
            setSkipReason('');
          }
        }}
      >
        <Dialog.Content maxWidth="440px" style={{ padding: '20px 24px' }}>
          <Dialog.Title size="3" mb="1">Ignorer l&apos;étape</Dialog.Title>
          {skipTarget?.label && (
            <Text as="p" size="2" color="gray" style={{ marginBottom: 12 }}>{skipTarget.label}</Text>
          )}
          <Box mb="3">
            <Text as="div" size="1" weight="bold" mb="1">Motif du skip <Text size="1" color="gray">(optionnel)</Text></Text>
            <TextField.Root
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              placeholder="Ex : pièce manquante, hors périmètre…"
            />
          </Box>
          <Flex gap="2" justify="end">
            <Button variant="soft" color="gray" onClick={() => { setSkipTarget(null); setSkipReason(''); }}>
              Annuler
            </Button>
            <Button color="orange" disabled={saving === skipTarget?.id} onClick={handleSkip}>
              Ignorer
            </Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </Box>
  );
}

TasksTab.displayName = 'TasksTab';

TasksTab.propTypes = {
  interventionId: PropTypes.string.isRequired,
  isLocked: PropTypes.bool,
};
