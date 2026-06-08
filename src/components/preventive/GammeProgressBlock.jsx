/* eslint-disable max-lines */
/**
 * @fileoverview Bloc de progression de la gamme de maintenance
 * @module components/preventive/GammeProgressBlock
 *
 * Deux modes :
 *   mode='intervention' — lecture+écriture, source par intervention_id
 *   mode='occurrence'   — lecture seule, source par occurrence_id
 */

import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { AlertDialog, Badge, Box, Button, Callout, Flex, Separator, Text, TextField } from '@radix-ui/themes';
import { AlertCircle, CheckCircle2, Circle, ClipboardCheck, ExternalLink, MinusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/auth/useAuth';
import {
  fetchInterventionTasks,
  fetchInterventionTasksProgress,
  fetchInterventionTasksByOccurrence,
  fetchInterventionTasksProgressByOccurrence,
  patchInterventionTask,
} from '@/api/interventionTasks';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';
import { TASK_STATUS_LABEL, TASK_STATUS_COLOR } from '@/config/taskConfig';

function ProgressBar({ done, total }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <Box style={{ height: 8, background: 'var(--gray-4)', borderRadius: 4, overflow: 'hidden', flex: 1 }}>
      <Box style={{ height: '100%', width: `${pct}%`, background: 'var(--green-9)', transition: 'width 0.3s' }} />
    </Box>
  );
}
ProgressBar.propTypes = { done: PropTypes.number.isRequired, total: PropTypes.number.isRequired };

function StepIcon({ status, optional }) {
  if (status === 'done') return <CheckCircle2 size={16} color="var(--green-9)" />;
  if (status === 'skipped') return <MinusCircle size={16} color="var(--orange-9)" />;
  if (optional) return <Circle size={16} color="var(--gray-7)" />;
  return <AlertCircle size={16} color="var(--orange-9)" />;
}
StepIcon.propTypes = { status: PropTypes.string.isRequired, optional: PropTypes.bool };

function StepRow({ task, onSkipOpen, saving, readOnly, canSkipObligatory }) {
  const isPending = task.status === 'todo' || task.status === 'in_progress';
  const isSaving = saving === task.id;
  const showSkip = isPending && (task.optional || canSkipObligatory);

  return (
    <Flex align="center" gap="2" py="2" style={{ borderBottom: '1px solid var(--gray-3)' }}>
      <StepIcon status={task.status} optional={task.optional} />
      <Box style={{ flex: 1 }}>
        <Flex align="center" gap="2">
          <Text
            size="2"
            weight={isPending ? 'regular' : 'medium'}
            color={task.optional && isPending ? 'gray' : undefined}
            style={task.optional ? { fontStyle: 'italic' } : undefined}
          >
            {task.label}
          </Text>
          {task.optional && (
            <Badge color="gray" variant="outline" size="1">Optionnelle</Badge>
          )}
        </Flex>
        {task.updated_at && task.status === 'done' && (
          <Text size="1" color="gray">{new Date(task.updated_at).toLocaleDateString('fr-FR')}</Text>
        )}
        {task.skip_reason && <Text size="1" color="orange">{task.skip_reason}</Text>}
      </Box>
      <Badge color={TASK_STATUS_COLOR[task.status] || 'gray'} variant="soft" size="1">
        {TASK_STATUS_LABEL[task.status] || task.status}
      </Badge>
      {!readOnly && isPending && (
        <Flex gap="1">
          {showSkip && (
            <Button size="1" color="orange" variant="ghost" disabled={isSaving} onClick={() => onSkipOpen(task)}>
              Ignorer
            </Button>
          )}
        </Flex>
      )}
    </Flex>
  );
}
StepRow.propTypes = {
  task: PropTypes.object.isRequired,
  onSkipOpen: PropTypes.func.isRequired,
  saving: PropTypes.string,
  readOnly: PropTypes.bool,
  canSkipObligatory: PropTypes.bool,
};

function ProgressSummary({ progress }) {
  if (!progress || progress.total === 0) return null;
  const { done, total, skipped, blocking_pending } = progress;
  const pending = progress.todo + progress.in_progress;
  const optionalPending = pending - (blocking_pending ?? pending);

  let badgeColor = 'green';
  let badgeLabel = 'Complète';
  if ((blocking_pending ?? pending) > 0) {
    badgeColor = 'orange';
    badgeLabel = `En cours — ${blocking_pending ?? pending} obligatoire(s) restante(s)`;
  } else if (pending > 0) {
    badgeColor = 'blue';
    badgeLabel = 'Obligatoires complètes — optionnelles en attente';
  }

  return (
    <Flex direction="column" gap="1" mb="3">
      <Flex align="center" gap="2">
        <Text size="2" color="gray">{done} / {total} validée(s)</Text>
        {skipped > 0 && <Text size="1" color="gray">· {skipped} ignorée(s)</Text>}
        <Badge color={badgeColor} variant="soft" size="1">{badgeLabel}</Badge>
      </Flex>
      <Flex align="center" gap="2">
        <ProgressBar done={done} total={total} />
      </Flex>
      {(blocking_pending ?? 0) > 0 && (
        <Text size="1" color="orange">⚠ {blocking_pending} étape{blocking_pending > 1 ? 's' : ''} obligatoire{blocking_pending > 1 ? 's' : ''} en attente</Text>
      )}
      {optionalPending > 0 && (blocking_pending ?? 0) === 0 && (
        <Text size="1" color="gray">· {optionalPending} étape{optionalPending > 1 ? 's' : ''} optionnelle{optionalPending > 1 ? 's' : ''} restante{optionalPending > 1 ? 's' : ''}</Text>
      )}
    </Flex>
  );
}
ProgressSummary.propTypes = { progress: PropTypes.object };

export default function GammeProgressBlock({ mode, interventionId, occurrenceId, diId, onProgressUpdate, refreshKey = 0 }) {
  const { user } = useAuth();
  const readOnly = mode === 'occurrence';
  const canSkipObligatory = !!(user?.role && ['RESP', 'ADMIN'].includes(user.role.toUpperCase()));

  const [tasks, setTasks] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loadState, setLoadState] = useState('idle');
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(null);
  const [skipTarget, setSkipTarget] = useState(null);
  const [skipReason, setSkipReason] = useState('');

  const loadData = useCallback(async () => {
    setLoadState('loading');
    setLoadError(null);
    try {
      const [t, p] = await Promise.all(
        mode === 'occurrence'
          ? [fetchInterventionTasksByOccurrence(occurrenceId), fetchInterventionTasksProgressByOccurrence(occurrenceId)]
          : [fetchInterventionTasks(interventionId), fetchInterventionTasksProgress(interventionId)]
      );
      // Garder uniquement les tâches d'origine plan (gamme)
      setTasks(Array.isArray(t) ? t.filter((task) => task.origin === 'plan') : []);
      setProgress(p);
      setLoadState('idle');
    } catch (err) {
      setLoadError(err.message || 'Erreur chargement gamme');
      setLoadState('error');
    }
  }, [mode, interventionId, occurrenceId]);

  useEffect(() => { loadData(); }, [loadData, refreshKey]);

  const handleSkip = async () => {
    if (!skipTarget) return;
    try {
      setSaving(skipTarget.id);
      await patchInterventionTask(skipTarget.id, {
        status: 'skipped',
        skip_reason: skipReason || null,
      });
      await loadData();
      onProgressUpdate?.();
    } finally {
      setSaving(null);
      setSkipTarget(null);
      setSkipReason('');
    }
  };

  if (loadState === 'loading') return <LoadingState fullscreen={false} message="Chargement de la gamme…" />;
  if (loadState === 'error') return <ErrorState error={loadError} onRetry={loadData} />;

  if (!tasks.length) {
    return (
      <Box pt="3">
        <Text size="2" color="gray">Aucune étape définie pour ce plan.</Text>
      </Box>
    );
  }

  const sorted = [...tasks].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const allPendingNoIntervention = readOnly && tasks.every((t) => !t.intervention_id);

  return (
    <Box pt="3">
      <Flex align="center" gap="3" mb="2">
        <ClipboardCheck size={18} color="var(--blue-9)" />
        <Text size="3" weight="bold">
          {readOnly ? 'Gamme préventive — aperçu' : 'Gamme de maintenance'}
        </Text>
      </Flex>

      <ProgressSummary progress={progress} />

      {readOnly && allPendingNoIntervention && (
        <Callout.Root color="blue" size="1" mb="3">
          <Callout.Icon><AlertCircle size={14} /></Callout.Icon>
          <Callout.Text>
            Cette gamme sera activée lors de l&apos;acceptation de la DI.
            {diId && (
              <> <Button size="1" variant="ghost" asChild style={{ display: 'inline-flex' }}>
                <Link to={`/interventions?tab=demandes`}><ExternalLink size={11} />Voir la DI</Link>
              </Button></>
            )}
          </Callout.Text>
        </Callout.Root>
      )}

      {readOnly && !allPendingNoIntervention && tasks.some((t) => t.intervention_id) && (
        <Box mb="3">
          <Button size="1" variant="ghost" asChild>
            <Link to={`/intervention/${tasks.find((t) => t.intervention_id)?.intervention_id}`}>
              <ExternalLink size={11} />Voir l&apos;intervention
            </Link>
          </Button>
        </Box>
      )}

      <Separator size="4" mb="3" />

      {sorted.map((task) => (
        <StepRow
          key={task.id}
          task={task}
          onSkipOpen={(s) => { setSkipTarget(s); setSkipReason(''); }}
          saving={saving}
          readOnly={readOnly}
          canSkipObligatory={canSkipObligatory}
        />
      ))}

      {!readOnly && (
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
      )}
    </Box>
  );
}

GammeProgressBlock.propTypes = {
  mode: PropTypes.oneOf(['intervention', 'occurrence']),
  interventionId: PropTypes.string,
  occurrenceId: PropTypes.string,
  diId: PropTypes.string,
  onProgressUpdate: PropTypes.func,
};

GammeProgressBlock.defaultProps = {
  mode: 'intervention',
};
