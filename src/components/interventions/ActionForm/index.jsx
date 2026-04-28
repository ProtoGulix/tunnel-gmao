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
import { Badge, Box, Flex, Text, Card, Button } from '@radix-ui/themes';
import { Plus, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import { INTERVENTION_TYPES } from '@/config/interventionTypes';
import { useActionForm } from './useActionForm';
import ActionFormFields from './ActionFormFields';
import ActionFormDescription from './ActionFormDescription';
import ActionFormComplexity from './ActionFormComplexity';
import ActionTaskSection from './ActionTaskSection';
import { ContextSection } from './ActionFormContext';
import CloseInterventionOverlay from './CloseInterventionOverlay';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';


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
  interventionMeta = null,
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
  const [selectedTasks, setSelectedTasks] = useState(
    Array.isArray(initialState?.tasks)
      ? initialState.tasks
      : (initialState?.task ? [initialState.task] : [])
  );
  const [timeRange, setTimeRange] = useState({
    start: initialState?.actionStart ?? null,
    end: initialState?.actionEnd ?? null,
  });
  const [manualTimeSpent, setManualTimeSpent] = useState(legacyTimeSpent ?? '');
  const [submitError, setSubmitError] = useState(null);

  const [pendingPayload, setPendingPayload] = useState(null);

  // Empêche la fermeture de l'onglet/navigation navigateur pendant l'overlay
  useEffect(() => {
    if (!pendingPayload) return;
    const handler = (e) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [pendingPayload]);

  // Mode préventif — identité visuelle verte
  const typeInterCode = interventionMeta?.type_inter ?? pickedIntervention?.type_inter ?? null;
  const isPreventif = typeInterCode === 'PRE';
  const typeConfig = typeInterCode
    ? INTERVENTION_TYPES.find((t) => t.id === typeInterCode)
    : null;

  const resolvedInterventionId = interventionId ?? pickedIntervention?.id;
  // techId prop > utilisateur connecté
  const resolvedTechId = techId ?? user?.id ?? null;

  const hasMissingTaskStatus = selectedTasks.some((task) => !task.taskActionStatus);

  const hasMissingSkippedReason = selectedTasks.some(
    (task) => task.taskActionStatus === 'skipped' && !task.skipReason?.trim()
  );

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
      ...(selectedTasks.length > 0 && {
        tasks: selectedTasks.map((task) => ({
          task_id: String(task.id),
          ...(task.taskActionStatus === 'done' ? { close_task: true } : {}),
          ...(task.taskActionStatus === 'skipped'
            ? { skip: true, skip_reason: task.skipReason.trim() }
            : {}),
        })),
      }),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (hasMissingTaskStatus) {
      setSubmitError('Un état est obligatoire pour chaque tâche sélectionnée');
      return;
    }

    if (hasMissingSkippedReason) {
      setSubmitError('Un motif est obligatoire pour chaque tâche marquée comme ignorée');
      return;
    }

    if (!form.handlers.handleValidate(timeRange, manualTimeSpent)) return;

    // Afficher l'overlay de clôture si l'intervention est connue et encore ouverte
    const shouldShowOverlay =
      resolvedInterventionId &&
      !['ferme', 'cancelled'].includes(interventionMeta?.status_actual);

    if (shouldShowOverlay) {
      setPendingPayload(buildPayload());
      return;
    }

    try {
      const result = await onSubmit(buildPayload());
      onSuccess?.(result);
    } catch (err) {
      setSubmitError(extractApiErrorMessage(err, 'Erreur lors de la soumission'));
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

  const cardStyle = isPreventif
    ? { backgroundColor: 'var(--green-2)', border: '1px solid var(--green-6)', borderLeft: '3px solid var(--green-9)', ...style }
    : { backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)', ...style };

  return (
    <Card style={{ ...cardStyle, position: 'relative' }}>
      <Flex direction="column" gap="3">
        {/* En-tête */}
        <Flex align="center" gap="2">
          {isPreventif ? <ShieldCheck size={20} color="var(--green-9)" /> : <Plus size={20} color="var(--blue-9)" />}
          <Text size="3" weight="bold">Nouvelle action</Text>
          {typeConfig && (
            <Badge size="1" color={typeConfig.color} variant="soft">
              {typeConfig.title}
            </Badge>
          )}
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
            {/* Plage horaire + Date + Type */}
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

            <ActionTaskSection
              interventionId={resolvedInterventionId}
              value={selectedTasks}
              onChange={setSelectedTasks}
              accentColor={isPreventif ? 'green' : 'blue'}
            />
            <ActionFormComplexity
              formState={form.formState}
              handlers={form.handlers}
              metadata={metadata}
              validation={form.validation}
            />
            <ActionFormDescription formState={form.formState} handlers={form.handlers} />

            <Flex justify="end" gap="2">
              <Button type="button" variant="soft" color="gray" onClick={handleCancel} size="2">
                Annuler
              </Button>
              <Button type="submit" color={isPreventif ? 'green' : 'blue'} size="2">
                <Plus size={16} /> Enregistrer
              </Button>
            </Flex>
          </Flex>
        </form>
      </Flex>

      {pendingPayload && (
        <CloseInterventionOverlay
          interventionId={resolvedInterventionId}
          interventionCode={interventionMeta?.code ?? pickedIntervention?.code}
          interventionTitle={interventionMeta?.title ?? pickedIntervention?.title}
          onSubmitAction={() => onSubmit(pendingPayload)}
          onSuccess={(result) => { setPendingPayload(null); onSuccess?.(result); }}
          onCancel={() => setPendingPayload(null)}
        />
      )}
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
  interventionMeta: PropTypes.shape({
    type_inter: PropTypes.string,
    plan_id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    code: PropTypes.string,
    title: PropTypes.string,
    status_actual: PropTypes.string,
  }),
  techId: PropTypes.string,
  lockedDate: PropTypes.bool,
  showContext: PropTypes.bool,
};

export default ActionForm;
