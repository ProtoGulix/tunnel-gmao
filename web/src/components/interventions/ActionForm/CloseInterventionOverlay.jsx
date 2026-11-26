/**
 * @fileoverview CloseInterventionOverlay — overlay de confirmation de clôture
 * @module components/interventions/ActionForm/CloseInterventionOverlay
 *
 * Remplace visuellement le contenu du formulaire (position: absolute; inset: 0)
 * après validation, avant soumission effective.
 * Séquence : enregistre l'action → demande si l'intervention est terminée →
 * clôture optionnellement via updateInterventionStatus.
 * Si le type exige un constat (ADR 0043), « Oui » ouvre d'abord le formulaire de constat.
 */
import { useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { Wrench } from 'lucide-react';
import { updateInterventionStatus } from '@/api/interventions';
import { createConstat } from '@/api/constats';
import ConstatForm from '@/components/constats/ConstatForm';
import { useConstatQuestions, useClosureConstatGate } from '@/hooks/constats/useConstats';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

/**
 * @param {Object}   props
 * @param {string}   props.interventionId    - UUID de l'intervention
 * @param {string}   [props.interventionCode]
 * @param {string}   [props.interventionTitle]
 * @param {Function} props.onSubmitAction    - () => Promise<result> — soumet le payload d'action
 * @param {Function} [props.onSuccess]       - Appelé (result) après la séquence complète
 * @param {Function} props.onCancel          - Revient au formulaire sans rien soumettre
 */
export default function CloseInterventionOverlay({
  interventionId,
  interventionCode,
  interventionTitle,
  onSubmitAction,
  onSuccess,
  onCancel,
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [gammeBlocked, setGammeBlocked] = useState(false);
  const actionSubmittedRef = useRef(false);
  const actionResultRef = useRef(null);
  const constatCreatedRef = useRef(false);
  const gate = useClosureConstatGate(interventionId);
  const [step, setStep] = useState('ask');
  const [choices, setChoices] = useState([]);
  const [machine, setMachine] = useState(null);
  const { questions } = useConstatQuestions(step === 'constat');

  const openConstat = () => {
    setMachine((m) => m ?? gate.machine);
    setStep('constat');
  };

  const tryClose = useCallback(async () => {
    try {
      await updateInterventionStatus(String(interventionId), 'ferme');
      return null;
    } catch (err) {
      if (err?.isAuditCancelled) return 'Clôture annulée : aucun motif choisi';
      if (err?.response?.status === 409) return 'GAMME_BLOCKED';
      return extractApiErrorMessage(err, "Impossible de clôturer l'intervention");
    }
  }, [interventionId]);

  const saveConstat = useCallback(async () => {
    if (constatCreatedRef.current) return null;
    try {
      await createConstat(String(interventionId), { choices, machine_id: machine?.id ?? null });
      constatCreatedRef.current = true;
      return null;
    } catch (err) {
      return extractApiErrorMessage(err, 'Constat refusé');
    }
  }, [interventionId, choices, machine]);

  const handleChoice = async (choice) => {
    setSubmitting(true);
    setError(null);

    // Si l'action a déjà été soumise (après un échec de clôture), ne pas la resoumettre
    let result = actionResultRef.current;
    if (!actionSubmittedRef.current) {
      try {
        result = await onSubmitAction();
        actionSubmittedRef.current = true;
        actionResultRef.current = result;
      } catch (err) {
        setError(extractApiErrorMessage(err, 'Erreur lors de la soumission'));
        setSubmitting(false);
        return;
      }
    }

    if (choice === 'close' && step === 'constat') {
      const constatError = await saveConstat();
      if (constatError) {
        setError(constatError);
        setSubmitting(false);
        return;
      }
    }

    if (choice === 'close') {
      const closeError = await tryClose();
      if (closeError === 'GAMME_BLOCKED') {
        setGammeBlocked(true);
        setError('Des étapes de gamme sont encore en attente.');
        setSubmitting(false);
        return;
      } else if (closeError) {
        setError(closeError);
        setSubmitting(false);
        return;
      }
    }

    setSubmitting(false);
    onSuccess?.(result);
  };

  return (
    <Flex
      direction="column"
      align="center"
      justify={step === 'constat' ? 'start' : 'center'}
      gap="4"
      style={{
        position: 'absolute',
        inset: 0,
        overflowY: 'auto',
        zIndex: 10,
        borderRadius: 'var(--radius-3)',
        background: 'var(--color-panel-solid)',
        padding: 'var(--space-5)',
      }}
    >
      <Wrench size={28} color="var(--blue-9)" />

      <Flex direction="column" align="center" gap="1">
        <Text size="4" weight="bold" align="center">
          {step === 'constat' ? 'Constat avant clôture' : "L'intervention est-elle terminée ?"}
        </Text>
        <Text size="2" color="gray" align="center">
          {[interventionCode, interventionTitle].filter(Boolean).join(' - ')}
        </Text>
      </Flex>

      {error && (
        <Box style={{
          background: 'var(--red-3)',
          border: '1px solid var(--red-7)',
          borderRadius: 'var(--radius-2)',
          padding: 'var(--space-3)',
          width: '100%',
        }}>
          <Text size="2" color="red" align="center">{error}</Text>
        </Box>
      )}

      <Box style={{ width: '100%', height: 1, background: 'var(--gray-4)' }} />

      {step === 'constat' && (
        <Box style={{ width: '100%' }}>
          <ConstatForm
            questions={questions}
            choices={choices}
            machine={machine}
            onChoicesChange={setChoices}
            onMachineChange={setMachine}
          />
        </Box>
      )}

      <Flex gap="3" justify="center" wrap="wrap">
        {step === 'constat' ? (
          <>
            <Button size="3" color="green" disabled={submitting || !questions || choices.length === 0} onClick={() => handleChoice('close')}>
              Clôturer
            </Button>
            <Button size="3" color="gray" variant="soft" disabled={submitting} onClick={() => setStep('ask')}>
              Retour
            </Button>
          </>
        ) : (
          <>
            {!gammeBlocked && (
              <Button
                size="3"
                color="green"
                disabled={submitting || !gate.ready}
                onClick={() => (gate.required && !constatCreatedRef.current ? openConstat() : handleChoice('close'))}
              >
                Oui, clôturer
              </Button>
            )}
            <Button
              size="3"
              color="gray"
              variant="soft"
              disabled={submitting}
              onClick={() => handleChoice('keep')}
            >
              Non, laisser ouverte
            </Button>
          </>
        )}
      </Flex>

      <Box style={{ width: '100%', height: 1, background: 'var(--gray-4)' }} />

      <Button
        variant="ghost"
        color="gray"
        size="1"
        type="button"
        disabled={submitting}
        onClick={onCancel}
      >
        Annuler — revenir au formulaire
      </Button>
    </Flex>
  );
}

CloseInterventionOverlay.propTypes = {
  interventionId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  interventionCode: PropTypes.string,
  interventionTitle: PropTypes.string,
  onSubmitAction: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func.isRequired,
};
