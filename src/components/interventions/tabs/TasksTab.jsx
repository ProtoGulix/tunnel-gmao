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
  AlertDialog, Badge, Box, Button, Card, Callout, Flex, Select, Separator, Spinner, Switch, Text, TextField,
} from '@radix-ui/themes';
import { AlertCircle, CheckCircle2, Circle, ClipboardCheck, ListTodo, MinusCircle, Plus } from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import {
  fetchInterventionTasks,
  fetchInterventionTasksProgress,
  patchInterventionTask,
} from '@/api/interventionTasks';
import { useTaskCreate } from '@/hooks/tasks/useTaskCreate';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';

/* ── Constantes ─────────────────────────────────────────────────────────────── */

const STATUS_LABEL = { done: 'Validée', skipped: 'Ignorée', todo: 'En attente', in_progress: 'En cours' };
const STATUS_COLOR = { done: 'green', skipped: 'orange', todo: 'gray', in_progress: 'blue' };

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
      <Badge color={STATUS_COLOR[task.status] || 'gray'} variant="soft" size="1">
        {STATUS_LABEL[task.status] || task.status}
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
  const { user } = useAuth();
  const canSkipObligatory = !!(user?.role && ['RESP', 'ADMIN'].includes(user.role.toUpperCase()));

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
          {!showCreate ? (
            <Button size="2" variant="soft" color="gray" onClick={() => setShowCreate(true)}>
              <Plus size={14} />
              Nouvelle tâche
            </Button>
          ) : (
            <Card style={{ backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)' }}>
              <form onSubmit={handleCreateSubmit}>
                <Flex direction="column" gap="3">
                  <Flex align="center" gap="2">
                    <Plus size={18} color="var(--blue-9)" />
                    <Text size="2" weight="bold">Nouvelle tâche</Text>
                  </Flex>

                  {createErrors.length > 0 && (
                    <Box style={{ background: 'var(--red-3)', border: '1px solid var(--red-7)', borderRadius: 6, padding: 12 }}>
                      {createErrors.map((err, idx) => (
                        <Text key={idx} as="div" color="red" size="1">• {err}</Text>
                      ))}
                    </Box>
                  )}

                  <Box>
                    <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>
                      Libellé <Text color="red">*</Text>
                    </Text>
                    <TextField.Root
                      value={formData.label}
                      onChange={(e) => set('label', e.target.value)}
                      placeholder="Ex : Contrôle alignement capteur"
                      autoFocus
                    />
                  </Box>

                  <Box>
                    <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>Assigné à</Text>
                    <Select.Root
                      value={formData.assignedTo || '__none__'}
                      onValueChange={(v) => set('assignedTo', v === '__none__' ? '' : v)}
                    >
                      <Select.Trigger placeholder="Non assigné" style={{ width: '100%' }} />
                      <Select.Content>
                        <Select.Item value="__none__">Non assigné</Select.Item>
                        {users.map((u) => {
                          const initials = (u.initials || u.initial || '').toUpperCase();
                          const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim();
                          return (
                            <Select.Item key={u.id} value={String(u.id)}>
                              {initials ? `${initials} — ${fullName}` : fullName}
                            </Select.Item>
                          );
                        })}
                      </Select.Content>
                    </Select.Root>
                  </Box>

                  <Box>
                    <Text as="label" size="1" weight="bold" mb="1" style={{ display: 'block' }}>Échéance</Text>
                    <TextField.Root
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) => set('dueDate', e.target.value)}
                    />
                  </Box>

                  <Flex align="center" gap="2">
                    <Switch checked={formData.optional} onCheckedChange={(v) => set('optional', v)} size="2" />
                    <Text size="2">Tâche optionnelle</Text>
                    <Text size="1" color="gray">(ne bloque pas la clôture)</Text>
                  </Flex>

                  <Flex justify="end" gap="2">
                    <Button
                      type="button"
                      variant="soft"
                      color="gray"
                      size="2"
                      onClick={() => { reset(); setShowCreate(false); }}
                    >
                      Annuler
                    </Button>
                    <Button type="submit" color="blue" size="2" disabled={savingCreate}>
                      {savingCreate ? <Spinner size="1" /> : <Plus size={14} />}
                      Enregistrer
                    </Button>
                  </Flex>
                </Flex>
              </form>
            </Card>
          )}
        </Box>
      )}

      {/* ── Dialog Ignorer ── */}
      <AlertDialog.Root open={!!skipTarget} onOpenChange={(open) => { if (!open) { setSkipTarget(null); setSkipReason(''); } }}>
        <AlertDialog.Content maxWidth="420px">
          <AlertDialog.Title>Ignorer l&apos;étape</AlertDialog.Title>
          <AlertDialog.Description>{skipTarget?.label}</AlertDialog.Description>
          <Box mt="2">
            <TextField.Root
              value={skipReason}
              onChange={(e) => setSkipReason(e.target.value)}
              placeholder="Raison (optionnel)…"
            />
          </Box>
          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Cancel><Button variant="soft" color="gray">Annuler</Button></AlertDialog.Cancel>
            <AlertDialog.Action>
              <Button color="orange" onClick={handleSkip}>Ignorer</Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Box>
  );
}

TasksTab.displayName = 'TasksTab';

TasksTab.propTypes = {
  interventionId: PropTypes.string.isRequired,
  isLocked: PropTypes.bool,
};
