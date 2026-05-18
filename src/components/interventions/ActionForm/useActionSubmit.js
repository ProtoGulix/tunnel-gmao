import { useState, useCallback, useEffect } from 'react';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

export function useActionSubmit({ form, resolvedInterventionId, resolvedTechId, timeRange, manualTimeSpent, selectedTasks, interventionMeta, onSubmit, onSuccess }) {
  const [submitError, setSubmitError] = useState(null);
  const [pendingPayload, setPendingPayload] = useState(null);

  useEffect(() => {
    if (!pendingPayload) return;
    const handler = (e) => { e.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [pendingPayload]);

  const buildPayload = useCallback(() => {
    const complexityScore = Number(form.formState.complexity);
    const complexityFactor =
      complexityScore > 5 && form.formState.complexityFactors.length > 0
        ? form.formState.complexityFactors[0]
        : undefined;

    return {
      intervention_id: resolvedInterventionId,
      action_subcategory: Number(form.formState.category) || undefined,
      description: form.formState.description,
      complexity_score: complexityScore,
      tech: resolvedTechId,
      ...(timeRange.start && timeRange.end
        ? { action_start: `${timeRange.start}:00`, action_end: `${timeRange.end}:00` }
        : { time_spent: parseFloat(manualTimeSpent) || 0 }
      ),
      ...(form.formState.date && { created_at: form.formState.date }),
      ...(complexityFactor && { complexity_factor: complexityFactor }),
      ...(selectedTasks.length > 0 && {
        tasks: selectedTasks.filter((task) => task.id != null).map((task) => ({
          task_id: task.id,
          ...(task.taskActionStatus === 'done' ? { close_task: true } : {}),
          ...(task.taskActionStatus === 'skipped'
            ? { skip: true, skip_reason: task.skipReason.trim() }
            : {}),
        })),
      }),
    };
  }, [form.formState, resolvedInterventionId, resolvedTechId, timeRange, manualTimeSpent, selectedTasks]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setSubmitError(null);

    if (!form.handlers.handleValidate(timeRange, manualTimeSpent)) return;

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
  }, [form.handlers, buildPayload, timeRange, manualTimeSpent, resolvedInterventionId, interventionMeta, onSubmit, onSuccess]);

  return { submitError, pendingPayload, setPendingPayload, handleSubmit };
}
