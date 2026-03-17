/**
 * @fileoverview ActionForm — formulaire unifié d'action
 * @module components/interventions/ActionForm
 *
 * Calqué sur le pattern SupplierItemForm : les props de contexte se verrouillent
 * quand elles sont fournies, sinon les sélecteurs s'affichent.
 *
 * Le formulaire construit toujours un payload canonique :
 *   { intervention_id, action_start, action_end, action_subcategory, description,
 *     created_at?, complexity_score, tech, complexity_factor? }
 *
 * Props de verrou (modes badge vs sélecteur) :
 *   interventionId — intervention déjà connue → badges verrouillés
 *   techId         — technicien fixé (sinon fallback sur l'utilisateur connecté)
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Box, Flex, Text, Card, Button } from '@radix-ui/themes';
import { Plus } from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import { useActionForm } from './useActionForm';
import ActionFormFields from './ActionFormFields';
import ActionFormDescription from './ActionFormDescription';
import ActionFormComplexity from './ActionFormComplexity';
import { ContextSection } from './ActionFormContext';

/* ── ActionForm principal ─────────────────────────────────────────────────── */
/* eslint-disable complexity */
function ActionForm({
  initialState = {},
  metadata = {},
  onCancel,
  onSubmit,
  onSuccess,
  style,
  interventionId = null,
  techId = null,
  legacyTimeSpent = null,
}) {
  const { user } = useAuth();
  const form = useActionForm(initialState);

  const [pickedEquipement, setPickedEquipement] = useState(null);
  const [pickedIntervention, setPickedIntervention] = useState(null);
  const [timeRange, setTimeRange] = useState({
    start: initialState?.actionStart ?? null,
    end: initialState?.actionEnd ?? null,
  });
  const [manualTimeSpent, setManualTimeSpent] = useState(legacyTimeSpent ?? '');

  const [submitError, setSubmitError] = useState(null);

  const resolvedInterventionId = interventionId ?? pickedIntervention?.id;
  // techId prop > utilisateur connecté
  const resolvedTechId = techId ?? user?.id ?? null;

  const buildPayload = () => {
    const complexityScore = Number(form.formState.complexity);
    const subcategoryId = Number(form.formState.category) || undefined;
    const complexityFactor =
      complexityScore > 5 && form.formState.complexityFactors.length > 0
        ? form.formState.complexityFactors[0]
        : undefined;

    return {
      intervention_id: resolvedInterventionId,
      action_subcategory: subcategoryId,
      description: form.formState.description,
      complexity_score: complexityScore,
      tech: resolvedTechId,
      ...(timeRange.start && timeRange.end
        ? { action_start: `${timeRange.start}:00`, action_end: `${timeRange.end}:00` }
        : { time_spent: parseFloat(manualTimeSpent) || legacyTimeSpent || 0 }
      ),
      ...(form.formState.date && { created_at: form.formState.date }),
      ...(complexityFactor && { complexity_factor: complexityFactor }),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!form.handlers.handleValidate(timeRange, manualTimeSpent)) return;

    try {
      const result = await onSubmit(buildPayload());
      onSuccess?.(result);
    } catch (err) {
      const detail = err?.response?.data?.detail ?? err?.message ?? 'Erreur lors de la soumission';
      setSubmitError(Array.isArray(detail) ? detail.map((e) => e.msg ?? String(e)).join(', ') : String(detail));
    }
  };

  const handleCancel = () => {
    form.handlers.handleReset();
    onCancel();
  };

  const allErrors = [...form.validation.errors, ...(submitError ? [submitError] : [])];

  if (!metadata) {
    return (
      <Card style={{ backgroundColor: 'var(--red-2)', border: '1px solid var(--red-6)', ...style }}>
        <Text color="red">Erreur : métadonnées manquantes</Text>
      </Card>
    );
  }

  return (
    <Card style={{ backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)', ...style }}>
      <Flex direction="column" gap="3">
        <Flex align="center" gap="2">
          <Plus size={20} color="var(--blue-9)" />
          <Text size="3" weight="bold">Nouvelle action</Text>
        </Flex>

        {allErrors.length > 0 && (
          <Box style={{ background: 'var(--red-3)', border: '1px solid var(--red-7)', borderRadius: '6px', padding: '12px' }}>
            <Text color="red" weight="bold" size="2">Erreurs de validation</Text>
            <Flex direction="column" gap="1" mt="1">
              {allErrors.map((err, i) => (
                <Text key={i} color="red" size="1">• {err}</Text>
              ))}
            </Flex>
          </Box>
        )}

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            {/* Section contexte — sélecteurs ou badges verrouillés */}
            <ContextSection
              interventionId={interventionId}
              pickedEquipement={pickedEquipement}
              onEquipementChange={(eq) => { setPickedEquipement(eq); setPickedIntervention(null); }}
              pickedIntervention={pickedIntervention}
              onInterventionChange={setPickedIntervention}
            />

            {/* Plage horaire + Date + Type sur une même ligne */}
            <ActionFormFields
              formState={form.formState}
              handlers={form.handlers}
              metadata={metadata}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              manualTimeSpent={manualTimeSpent}
              onManualTimeSpentChange={setManualTimeSpent}
            />

            <ActionFormDescription formState={form.formState} handlers={form.handlers} />
            <ActionFormComplexity
              formState={form.formState}
              handlers={form.handlers}
              metadata={metadata}
              validation={form.validation}
            />

            <Flex justify="end" gap="2">
              <Button type="button" variant="soft" color="gray" onClick={handleCancel} size="2">
                Annuler
              </Button>
              <Button type="submit" color="blue" size="2">
                <Plus size={16} /> Enregistrer
              </Button>
            </Flex>
          </Flex>
        </form>
      </Flex>
    </Card>
  );
}

ActionForm.displayName = 'ActionForm';

ActionForm.propTypes = {
  initialState: PropTypes.shape({
    date: PropTypes.string,
    category: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    description: PropTypes.string,
    complexity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    complexityFactors: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
  }),
  metadata: PropTypes.shape({
    subcategories: PropTypes.array,
    complexityFactors: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      label: PropTypes.string,
    })),
  }),
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  style: PropTypes.object,
  interventionId: PropTypes.string,
  techId: PropTypes.string,
};

export default ActionForm;

