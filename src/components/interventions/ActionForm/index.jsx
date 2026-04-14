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

import { useState, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Checkbox, Flex, Text, Card, Button } from '@radix-ui/themes';
import { ClipboardCheck, Plus } from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import { fetchGammeStepValidations } from '@/api/gammeStepValidations';
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
  lockedDate = false,
  gammeValidations = [],
  showContext = true,
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

  const [selectedStepIds, setSelectedStepIds] = useState(() => new Set());
  // Steps chargés dynamiquement quand une intervention avec plan_id est sélectionnée dans le planning
  const [dynamicGammeValidations, setDynamicGammeValidations] = useState([]);

  useEffect(() => {
    if (!pickedIntervention?.plan_id) {
      setDynamicGammeValidations([]);
      setSelectedStepIds(new Set());
      return;
    }
    fetchGammeStepValidations(String(pickedIntervention.id))
      .then((validations) => {
        setDynamicGammeValidations(Array.isArray(validations) ? validations : []);
        setSelectedStepIds(new Set());
      })
      .catch(() => setDynamicGammeValidations([]));
  }, [pickedIntervention?.id, pickedIntervention?.plan_id]);

  // La prop gammeValidations est prioritaire (contexte intervention fixée) ; sinon on utilise les dynamiques
  const activeGammeValidations = gammeValidations.length > 0 ? gammeValidations : dynamicGammeValidations;
  const pendingSteps = activeGammeValidations
    .filter((v) => v.status === 'pending')
    .sort((a, b) => (a.step_sort_order ?? 0) - (b.step_sort_order ?? 0));

  const toggleStep = useCallback((id) => {
    setSelectedStepIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

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
      ...(selectedStepIds.size > 0 && {
        gamme_step_validations: [...selectedStepIds].map((id) => ({ step_validation_id: id, status: 'validated' })),
      }),
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

        {/* Section contexte — masquée quand l'intervention est déjà fixée par le parent */}
        {showContext && (
          <>
            <ContextSection
              interventionId={interventionId}
              pickedEquipement={pickedEquipement}
              onEquipementChange={(eq) => { setPickedEquipement(eq); setPickedIntervention(null); }}
              pickedIntervention={pickedIntervention}
              onInterventionChange={setPickedIntervention}
            />
          </>
        )}

        <form onSubmit={handleSubmit}>
          <Flex direction="column" gap="3">
            {/* Plage horaire + Date + Type sur une même ligne */}
            <ActionFormFields
              formState={form.formState}
              handlers={form.handlers}
              metadata={metadata}
              timeRange={timeRange}
              onTimeRangeChange={setTimeRange}
              manualTimeSpent={manualTimeSpent}
              onManualTimeSpentChange={setManualTimeSpent}
              lockedDate={lockedDate}
            />

            <ActionFormDescription formState={form.formState} handlers={form.handlers} />
            <ActionFormComplexity
              formState={form.formState}
              handlers={form.handlers}
              metadata={metadata}
              validation={form.validation}
            />

            {/* Étapes de gamme à valider avec cette action */}
            {pendingSteps.length > 0 && (
              <Box style={{ background: 'var(--green-2)', border: '1px solid var(--green-6)', borderRadius: 'var(--radius-2)', padding: '0.5rem 0.75rem' }}>
                <Flex align="center" gap="2" mb="2">
                  <ClipboardCheck size={14} color="var(--green-9)" />
                  <Text size="2" weight="bold">Valider des étapes avec cette action</Text>
                  {selectedStepIds.size > 0 && (
                    <Badge color="green" variant="soft" size="1">
                      {selectedStepIds.size}/{pendingSteps.length}
                    </Badge>
                  )}
                </Flex>
                <Flex direction="column" gap="1">
                  {pendingSteps.map((v) => (
                    <label key={v.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '2px 0' }}>
                      <Checkbox
                        checked={selectedStepIds.has(v.id)}
                        onCheckedChange={() => toggleStep(v.id)}
                      />
                      <Text size="2" style={{ flex: 1, userSelect: 'none' }}>{v.step_label}</Text>
                      {v.step_optional && <Badge color="gray" variant="outline" size="1">Opt.</Badge>}
                    </label>
                  ))}
                </Flex>
              </Box>
            )}

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
  lockedDate: PropTypes.bool,
  showContext: PropTypes.bool,
  gammeValidations: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    step_label: PropTypes.string.isRequired,
    step_sort_order: PropTypes.number,
    step_optional: PropTypes.bool,
    status: PropTypes.string.isRequired,
  })),
};

export default ActionForm;
