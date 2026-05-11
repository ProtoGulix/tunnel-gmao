import { useState } from 'react';
import PropTypes from 'prop-types';
import { Badge, Box, Flex, Text, Card, Button } from '@radix-ui/themes';
import { Plus, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/auth/useAuth';
import { INTERVENTION_TYPES } from '@/config/interventionTypes';
import { useActionForm } from './useActionForm';
import { useActionSubmit } from './useActionSubmit';
import ActionFormFields from './ActionFormFields';
import ActionFormDescription from './ActionFormDescription';
import ActionFormComplexity from './ActionFormComplexity';
import ActionTaskSection from './ActionTaskSection';
import { ContextSection } from './ActionFormContext';
import CloseInterventionOverlay from './CloseInterventionOverlay';

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
  lockedDate = false,
  gammeValidations = [],
  showContext = true,
}) {
  const { user } = useAuth();
  const form = useActionForm(initialState);

  const [pickedEquipement, setPickedEquipement] = useState(null);
  const [pickedIntervention, setPickedIntervention] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState(
    Array.isArray(initialState?.tasks) ? initialState.tasks
      : (initialState?.task ? [initialState.task] : [])
  );
  const [timeRange, setTimeRange] = useState({
    start: initialState?.actionStart ?? null,
    end: initialState?.actionEnd ?? null,
  });
  const [manualTimeSpent, setManualTimeSpent] = useState('');

  const typeInterCode = interventionMeta?.type_inter ?? pickedIntervention?.type_inter ?? null;
  const isPreventif = typeInterCode === 'PRE';
  const typeConfig = typeInterCode ? INTERVENTION_TYPES.find((t) => t.id === typeInterCode) : null;

  const resolvedInterventionId = interventionId ?? pickedIntervention?.id;
  const resolvedTechId = techId ?? user?.id ?? null;

  const { submitError, pendingPayload, setPendingPayload, handleSubmit } = useActionSubmit({
    form, resolvedInterventionId, resolvedTechId,
    timeRange, manualTimeSpent, selectedTasks,
    interventionMeta, onSubmit, onSuccess,
  });

  const hasMissingTaskStatus = selectedTasks.some((t) => !t.taskActionStatus);
  const hasMissingSkippedReason = selectedTasks.some(
    (t) => t.taskActionStatus === 'skipped' && !t.skipReason?.trim()
  );

  const allErrors = [...form.validation.errors, ...(submitError ? [submitError] : [])];

  const cardStyle = isPreventif
    ? { backgroundColor: 'var(--green-2)', border: '1px solid var(--green-6)', borderLeft: '3px solid var(--green-9)', ...style }
    : { backgroundColor: 'var(--blue-2)', border: '1px solid var(--blue-6)', ...style };

  if (!metadata) {
    return (
      <Card style={{ backgroundColor: 'var(--red-2)', border: '1px solid var(--red-6)', ...style }}>
        <Text color="red">Erreur : métadonnées manquantes</Text>
      </Card>
    );
  }

  return (
    <Card style={{ ...cardStyle, position: 'relative' }}>
      <Flex direction="column" gap="3">
        <Flex align="center" gap="2">
          {isPreventif ? <ShieldCheck size={20} color="var(--green-9)" /> : <Plus size={20} color="var(--blue-9)" />}
          <Text size="3" weight="bold">Nouvelle action</Text>
          {typeConfig && <Badge size="1" color={typeConfig.color} variant="soft">{typeConfig.title}</Badge>}
        </Flex>

        {allErrors.length > 0 && (
          <Box style={{ background: 'var(--red-3)', border: '1px solid var(--red-7)', borderRadius: '6px', padding: '12px' }}>
            <Text color="red" weight="bold" size="2">Erreurs de validation</Text>
            <Flex direction="column" gap="1" mt="1">
              {allErrors.map((err, i) => <Text key={i} color="red" size="1">• {err}</Text>)}
            </Flex>
          </Box>
        )}

        {showContext && (
          <ContextSection
            interventionId={interventionId}
            pickedEquipement={pickedEquipement}
            onEquipementChange={(eq) => { setPickedEquipement(eq); setPickedIntervention(null); }}
            pickedIntervention={pickedIntervention}
            onInterventionChange={setPickedIntervention}
          />
        )}

        <form onSubmit={(e) => handleSubmit(e, { hasMissingTaskStatus, hasMissingSkippedReason })}>
          <Flex direction="column" gap="3">
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
              <Button type="button" variant="soft" color="gray" onClick={() => { form.handlers.handleReset(); onCancel(); }} size="2">
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
  gammeValidations: PropTypes.array,
};

export default ActionForm;
