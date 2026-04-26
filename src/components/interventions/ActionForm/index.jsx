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
import { ClipboardCheck, Plus, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import { fetchInterventionTasks } from '@/api/interventionTasks';
import { INTERVENTION_TYPES } from '@/config/interventionTypes';
import { useActionForm } from './useActionForm';
import ActionFormFields from './ActionFormFields';
import ActionFormDescription from './ActionFormDescription';
import ActionFormComplexity from './ActionFormComplexity';
import { ContextSection } from './ActionFormContext';
import CloseInterventionOverlay from './CloseInterventionOverlay';


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
  const [timeRange, setTimeRange] = useState({
    start: initialState?.actionStart ?? null,
    end: initialState?.actionEnd ?? null,
  });
  const [manualTimeSpent, setManualTimeSpent] = useState(legacyTimeSpent ?? '');
  const [submitError, setSubmitError] = useState(null);

  const [selectedStepIds, setSelectedStepIds] = useState(() => new Set());
  const [pendingPayload, setPendingPayload] = useState(null);

  // Empêche la fermeture de l'onglet/navigation navigateur pendant l'overlay
  useEffect(() => {
    if (!pendingPayload) return;
    const handler = (e) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [pendingPayload]);

  // Steps chargés dynamiquement quand une intervention avec plan_id est sélectionnée dans le planning
  const [dynamicGammeValidations, setDynamicGammeValidations] = useState([]);

  useEffect(() => {
    if (!pickedIntervention?.plan_id) {
      setDynamicGammeValidations([]);
      setSelectedStepIds(new Set());
      return;
    }
    fetchInterventionTasks(String(pickedIntervention.id))
      .then((tasks) => {
        setDynamicGammeValidations(Array.isArray(tasks) ? tasks.filter((t) => t.origin === 'plan') : []);
        setSelectedStepIds(new Set());
      })
      .catch(() => setDynamicGammeValidations([]));
  }, [pickedIntervention?.id, pickedIntervention?.plan_id]);

  // La prop gammeValidations est prioritaire (contexte intervention fixée) ; sinon on utilise les dynamiques
  const activeGammeValidations = gammeValidations.length > 0 ? gammeValidations : dynamicGammeValidations;
  const pendingSteps = activeGammeValidations
    .filter((t) => t.status === 'todo' || t.status === 'in_progress')
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const hasGamme = pendingSteps.length > 0;

  // Mode préventif — identité visuelle verte
  const typeInterCode = interventionMeta?.type_inter ?? pickedIntervention?.type_inter ?? null;
  const isPreventif = typeInterCode === 'PRE';
  const typeConfig = typeInterCode
    ? INTERVENTION_TYPES.find((t) => t.id === typeInterCode)
    : null;

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
        task_id: [...selectedStepIds][0],
      }),
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError(null);

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

  const cardStyle = isPreventif
    ? { backgroundColor: 'var(--green-2)', border: '1px solid var(--green-6)', borderLeft: '3px solid var(--green-9)', ...style }
    : { backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)', ...style };

  const progressPct = hasGamme
    ? Math.round((selectedStepIds.size / pendingSteps.length) * 100)
    : 0;

  const gammeBlock = hasGamme && (
    <Box style={{ background: isPreventif ? 'var(--green-3)' : 'var(--green-2)', border: '1px solid var(--green-6)', borderRadius: 'var(--radius-3)', padding: '0.75rem' }}>
      {/* Titre + compteur */}
      <Flex align="center" gap="2" mb="1">
        <ClipboardCheck size={14} color="var(--green-9)" />
        <Text size="2" weight="bold" color="green">
          Étapes de la gamme · {pendingSteps.length} à valider
        </Text>
        {selectedStepIds.size > 0 && (
          <Badge color="green" variant="soft" size="1">
            {selectedStepIds.size}/{pendingSteps.length}
          </Badge>
        )}
      </Flex>

      {/* Barre de progression */}
      <Box style={{ height: 3, background: 'var(--green-3)', borderRadius: 2, marginBottom: '0.75rem', overflow: 'hidden' }}>
        <Box style={{ height: '100%', width: `${progressPct}%`, background: 'var(--green-9)', transition: 'width 0.2s ease' }} />
      </Box>

      {/* Liste des étapes */}
      <Flex direction="column" gap="1">
        {pendingSteps.map((task) => {
          const checked = selectedStepIds.has(task.id);
          return (
            <label key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '3px 0' }}>
              <Checkbox
                checked={checked}
                onCheckedChange={() => toggleStep(task.id)}
              />
              <Text
                size="2"
                style={{
                  flex: 1,
                  userSelect: 'none',
                  color: checked ? 'var(--green-11)' : 'var(--gray-12)',
                  textDecoration: checked ? 'line-through' : 'none',
                  opacity: checked ? 0.7 : 1,
                  transition: 'color 0.15s, opacity 0.15s',
                }}
              >
                {task.label}
              </Text>
              {task.optional && <Badge color="gray" variant="outline" size="1">Opt.</Badge>}
            </label>
          );
        })}
      </Flex>
    </Box>
  );

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

            {/* Réordonnancement conditionnel selon présence de gamme */}
            {hasGamme ? (
              <>
                {gammeBlock}
                <ActionFormDescription formState={form.formState} handlers={form.handlers} />
                <ActionFormComplexity
                  formState={form.formState}
                  handlers={form.handlers}
                  metadata={metadata}
                  validation={form.validation}
                />
              </>
            ) : (
              <>
                <ActionFormDescription formState={form.formState} handlers={form.handlers} />
                <ActionFormComplexity
                  formState={form.formState}
                  handlers={form.handlers}
                  metadata={metadata}
                  validation={form.validation}
                />
              </>
            )}

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
  gammeValidations: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    sort_order: PropTypes.number,
    optional: PropTypes.bool,
    status: PropTypes.string.isRequired,
  })),
};

export default ActionForm;
