/* eslint-disable max-lines */
/**
 * @fileoverview Bloc de progression de la gamme de maintenance d'une intervention
 * @module components/preventive/GammeProgressBlock
 */

import { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { AlertDialog, Badge, Box, Button, Flex, Separator, Text, TextField } from '@radix-ui/themes';
import { CheckCircle2, Circle, ClipboardCheck, MinusCircle } from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import {
  fetchGammeStepValidations,
  fetchGammeProgress,
  patchGammeStepValidation,
} from '@/api/gammeStepValidations';
import LoadingState from '@/components/ui/LoadingState';
import ErrorState from '@/components/ui/ErrorState';

const STATUS_ICON = {
  validated: <CheckCircle2 size={16} color="var(--green-9)" />,
  skipped: <MinusCircle size={16} color="var(--orange-9)" />,
  pending: <Circle size={16} color="var(--gray-7)" />,
};

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

function StepRow({ v, onValidate, onSkipOpen, saving }) {
  const isPending = v.status === 'pending';
  const isSaving = saving === v.id;
  return (
    <Flex align="center" gap="2" py="2" style={{ borderBottom: '1px solid var(--gray-3)' }}>
      {STATUS_ICON[v.status] ?? STATUS_ICON.pending}
      <Box style={{ flex: 1 }}>
        <Flex align="center" gap="2">
          <Text size="2" weight={isPending ? 'regular' : 'medium'}>{v.step_label}</Text>
          {v.step_optional && <Badge color="amber" variant="soft" size="1">Opt.</Badge>}
        </Flex>
        {v.validated_at && (
          <Text size="1" color="gray">{new Date(v.validated_at).toLocaleDateString('fr-FR')}</Text>
        )}
        {v.skip_reason && <Text size="1" color="orange">{v.skip_reason}</Text>}
      </Box>
      <Badge color={STATUS_COLOR[v.status] || 'gray'} variant="soft" size="1">
        {STATUS_LABEL[v.status] || v.status}
      </Badge>
      {isPending && (
        <Flex gap="1">
          <Button size="1" color="green" variant="soft" disabled={isSaving} onClick={() => onValidate(v)}>
            {isSaving ? '…' : 'Valider'}
          </Button>
          {v.step_optional && (
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
};

export default function GammeProgressBlock({ interventionId }) {
  const { user } = useAuth();
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
      const [v, p] = await Promise.all([
        fetchGammeStepValidations(interventionId),
        fetchGammeProgress(interventionId),
      ]);
      setValidations(Array.isArray(v) ? v : []);
      setProgress(p);
      setLoadState('idle');
    } catch (err) {
      setLoadError(err.message || 'Erreur chargement gamme');
      setLoadState('error');
    }
  }, [interventionId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleValidate = async (step) => {
    try {
      setSaving(step.id);
      await patchGammeStepValidation(step.id, { status: 'validated', validated_by: user?.id });
      await loadData();
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
    } finally {
      setSaving(null);
      setSkipTarget(null);
      setSkipReason('');
    }
  };

  if (loadState === 'loading') return <LoadingState fullscreen={false} message="Chargement de la gamme…" />;
  if (loadState === 'error') return <ErrorState error={{ message: loadError }} onRetry={loadData} />;
  if (!validations.length) return null;

  const sorted = [...validations].sort((a, b) => (a.step_sort_order ?? 0) - (b.step_sort_order ?? 0));

  return (
    <Box pt="3">
      <Flex align="center" gap="3" mb="2">
        <ClipboardCheck size={18} color="var(--blue-9)" />
        <Text size="3" weight="bold">Gamme de maintenance</Text>
        <Text size="2" color="gray">{progress?.validated ?? 0} / {progress?.total ?? 0} validée(s)</Text>
        {progress?.is_complete && <Badge color="green">Complète</Badge>}
      </Flex>
      <Flex align="center" gap="2" mb="3">
        <Text size="1" color="gray">{progress?.pending ?? 0} en attente · {progress?.skipped ?? 0} ignorée(s)</Text>
        <ProgressBar validated={progress?.validated ?? 0} total={progress?.total ?? 0} />
      </Flex>
      <Separator size="4" mb="3" />
      {sorted.map((v) => (
        <StepRow key={v.id} v={v} onValidate={handleValidate} onSkipOpen={(s) => { setSkipTarget(s); setSkipReason(''); }} saving={saving} />
      ))}

      <AlertDialog.Root open={!!skipTarget} onOpenChange={(open) => { if (!open) { setSkipTarget(null); setSkipReason(''); } }}>
        <AlertDialog.Content maxWidth="420px">
          <AlertDialog.Title>Ignorer l'étape</AlertDialog.Title>
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
    </Box>
  );
}

GammeProgressBlock.propTypes = {
  interventionId: PropTypes.string.isRequired,
};
