/**
 * @fileoverview CloseInterventionOverlay — overlay de confirmation de clôture
 * @module components/interventions/ActionForm/CloseInterventionOverlay
 *
 * Remplace visuellement le contenu du formulaire (position: absolute; inset: 0)
 * après validation, avant soumission effective.
 * Séquence : enregistre l'action → demande si l'intervention est terminée →
 * clôture optionnellement via updateInterventionStatus.
 */
import { useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { Box, Button, Flex, Text } from '@radix-ui/themes';
import { Wrench } from 'lucide-react';
import { updateInterventionStatus } from '@/api/interventions';
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

  const tryClose = useCallback(async () => {
    try {
      await updateInterventionStatus(String(interventionId), 'ferme', 'ROUTINE');
      return null;
    } catch (err) {
      if (err?.response?.status === 409) return 'GAMME_BLOCKED';
      return extractApiErrorMessage(err, "Impossible de clôturer l'intervention");
    }
  }, [interventionId]);

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
      justify="center"
      gap="4"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        borderRadius: 'var(--radius-3)',
        background: 'var(--color-panel-solid)',
        padding: 'var(--space-5)',
      }}
    >
      <Wrench size={28} color="var(--blue-9)" />

      <Flex direction="column" align="center" gap="1">
        <Text size="4" weight="bold" align="center">
          L&apos;intervention est-elle terminée ?
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

      <Flex gap="3" justify="center" wrap="wrap">
        {!gammeBlocked && (
          <Button
            size="3"
            color="green"
            disabled={submitting}
            onClick={() => handleChoice('close')}
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
