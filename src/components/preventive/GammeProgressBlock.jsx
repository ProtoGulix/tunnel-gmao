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
  fetchGammeStepValidations,
  fetchGammeProgress,
  fetchGammeStepValidationsByOccurrence,
  fetchGammeProgressByOccurrence,
  patchGammeStepValidation,
} from '@/api/gammeStepValidations';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';

const STATUS_LABEL = { validated: 'Validée', skipped: 'Ignorée', pending: 'En attente' };
const STATUS_COLOR = { validated: 'green', skipped: 'orange', pending: 'gray' };

function ProgressBar({ validated, total }) {
  const pct = total === 0 ? 0 : Math.round((validated / total) * 100);
  return (
    <Box style={{ height: 8, background: 'var(--gray-4)', borderRadius: 4, overflow: 'hidden', flex: 1 }}>
      <Box style={{ height: '100%', width: `${pct}%`, background: 'var(--green-9)', transition: 'width 0.3s' }} />
    </Box>
  );
}
ProgressBar.propTypes = { validated: PropTypes.number.isRequired, total: PropTypes.number.isRequired };

function StepIcon({ status, optional }) {
  if (status === 'validated') return <CheckCircle2 size={16} color="var(--green-9)" />;
  if (status === 'skipped') return <MinusCircle size={16} color="var(--orange-9)" />;
  if (optional) return <Circle size={16} color="var(--gray-7)" />;
  return <AlertCircle size={16} color="var(--orange-9)" />;
}
StepIcon.propTypes = { status: PropTypes.string.isRequired, optional: PropTypes.bool };

function StepRow({ v, onValidate, onSkipOpen, saving, readOnly, canSkipObligatory }) {
  const isPending = v.status === 'pending';
  const isSaving = saving === v.id;
  const showSkip = isPending && (v.step_optional || canSkipObligatory);

  return (
    <Flex align="center" gap="2" py="2" style={{ borderBottom: '1px solid var(--gray-3)' }}>
      <StepIcon status={v.status} optional={v.step_optional} />
      <Box style={{ flex: 1 }}>
        <Flex align="center" gap="2">
          <Text
            size="2"
            weight={isPending ? 'regular' : 'medium'}
            color={v.step_optional && isPending ? 'gray' : undefined}
            style={v.step_optional ? { fontStyle: 'italic' } : undefined}
          >
            {v.step_label}
          </Text>
          {v.step_optional && (
            <Badge color="gray" variant="outline" size="1">Optionnelle</Badge>
          )}
        </Flex>
        {v.validated_at && (
          <Text size="1" color="gray">{new Date(v.validated_at).toLocaleDateString('fr-FR')}</Text>
        )}
        {v.skip_reason && <Text size="1" color="orange">{v.skip_reason}</Text>}
      </Box>
      <Badge color={STATUS_COLOR[v.status] || 'gray'} variant="soft" size="1">
        {STATUS_LABEL[v.status] || v.status}
      </Badge>
      {!readOnly && isPending && (
        <Flex gap="1">
          <Button size="1" color="green" variant="soft" disabled={isSaving} onClick={() => onValidate(v)}>
            {isSaving ? '…' : 'Valider'}
          </Button>
          {showSkip && (
            <Button size="1" color="orange" variant="ghost" disabled={isSaving} onClick={() => onSkipOpen(v)}>
              Ignorer
            </Button>
          )}
        </Flex>
      )}
    </Flex>
  );
}
StepRow.propTypes = {
  v: PropTypes.object.isRequired,
  onValidate: PropTypes.func.isRequired,
  onSkipOpen: PropTypes.func.isRequired,
  saving: PropTypes.string,
  readOnly: PropTypes.bool,
  canSkipObligatory: PropTypes.bool,
};

function ProgressSummary({ progress }) {
  if (!progress || progress.total === 0) return null;
  const { validated, total, skipped, pending, blocking_pending } = progress;
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
        <Text size="2" color="gray">{validated} / {total} validée(s)</Text>
        {skipped > 0 && <Text size="1" color="gray">· {skipped} ignorée(s)</Text>}
        <Badge color={badgeColor} variant="soft" size="1">{badgeLabel}</Badge>
      </Flex>
      <Flex align="center" gap="2">
        <ProgressBar validated={validated} total={total} />
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

export default function GammeProgressBlock({ mode, interventionId, occurrenceId, diId, onProgressUpdate }) {
  const { user } = useAuth();
  const readOnly = mode === 'occurrence';
  const canSkipObligatory = !!(user?.role && ['RESP', 'ADMIN'].includes(user.role));

  const [validations, setValidations] = useState([]);
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
      const [v, p] = await Promise.all(
        mode === 'occurrence'
          ? [fetchGammeStepValidationsByOccurrence(occurrenceId), fetchGammeProgressByOccurrence(occurrenceId)]
          : [fetchGammeStepValidations(interventionId), fetchGammeProgress(interventionId)]
      );
      setValidations(Array.isArray(v) ? v : []);
      setProgress(p);
      setLoadState('idle');
    } catch (err) {
      setLoadError(err.message || 'Erreur chargement gamme');
      setLoadState('error');
    }
  }, [mode, interventionId, occurrenceId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleValidate = async (step) => {
    try {
      setSaving(step.id);
      await patchGammeStepValidation(step.id, { status: 'validated', validated_by: user?.id });
      await loadData();
      onProgressUpdate?.();
    } finally {
      setSaving(null);
    }
  };

  const handleSkip = async () => {
    if (!skipTarget) return;
    try {
      setSaving(skipTarget.id);
      await patchGammeStepValidation(skipTarget.id, {
        status: 'skipped',
        validated_by: user?.id,
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
  if (loadState === 'error') return <ErrorState error={{ message: loadError }} onRetry={loadData} />;

  if (!validations.length) {
    return (
      <Box pt="3">
        <Text size="2" color="gray">Aucune étape définie pour ce plan.</Text>
      </Box>
    );
  }

  const sorted = [...validations].sort((a, b) => (a.step_sort_order ?? 0) - (b.step_sort_order ?? 0));
  const allPendingNoIntervention = readOnly && validations.every((v) => !v.intervention_id);

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

      {readOnly && !allPendingNoIntervention && validations.some((v) => v.intervention_id) && (
        <Box mb="3">
          <Button size="1" variant="ghost" asChild>
            <Link to={`/intervention/${validations.find((v) => v.intervention_id)?.intervention_id}`}>
              <ExternalLink size={11} />Voir l&apos;intervention
            </Link>
          </Button>
        </Box>
      )}

      <Separator size="4" mb="3" />

      {sorted.map((v) => (
        <StepRow
          key={v.id}
          v={v}
          onValidate={handleValidate}
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
            <AlertDialog.Description>{skipTarget?.step_label}</AlertDialog.Description>
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

