import { useState, useCallback, useEffect } from 'react';
import { createInterventionTask } from '@/api/interventionTasks';
import { fetchTasksWorkspace } from '@/api/tasks';
import { fetchActiveUsers } from '@/api/planning';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

const EMPTY_FORM = {
  label: '',
  interventionId: '',
  assignedTo: '',
  dueDate: '',
  optional: false,
};

export function useTaskCreate({ interventionId: lockedInterventionId = null, onSuccess } = {}) {
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [users, setUsers] = useState([]);
  const [interventions, setInterventions] = useState([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    fetchActiveUsers().then(setUsers).catch(() => {});
  }, []);

  const loadOptions = useCallback(async () => {
    if (lockedInterventionId) return;
    setOptionsLoading(true);
    try {
      const result = await fetchTasksWorkspace({ include_options: true, limit: 1 });
      setInterventions(result.options?.interventions ?? []);
    } catch {
      // options non critiques
    } finally {
      setOptionsLoading(false);
    }
  }, [lockedInterventionId]);

  const reset = useCallback(() => {
    setFormData(EMPTY_FORM);
    setErrors([]);
  }, []);

  const set = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const validate = useCallback(() => {
    const errs = [];
    if (!formData.label.trim()) errs.push('Le libellé est obligatoire');
    const resolvedId = lockedInterventionId ?? formData.interventionId;
    if (!resolvedId) errs.push("L'intervention est obligatoire");
    return errs;
  }, [formData, lockedInterventionId]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const errs = validate();
      if (errs.length) {
        setErrors(errs);
        return;
      }
      setErrors([]);
      setSaving(true);
      try {
        const created = await createInterventionTask({
          intervention_id: lockedInterventionId ?? formData.interventionId,
          label: formData.label.trim(),
          assigned_to: formData.assignedTo || undefined,
          due_date: formData.dueDate || undefined,
          optional: formData.optional,
          origin: 'tech',
        });
        reset();
        onSuccess?.(created);
      } catch (err) {
        setErrors([extractApiErrorMessage(err, 'Erreur lors de la création de la tâche')]);
      } finally {
        setSaving(false);
      }
    },
    [formData, lockedInterventionId, validate, reset, onSuccess]
  );

  return {
    formData,
    set,
    users,
    interventions,
    optionsLoading,
    saving,
    errors,
    reset,
    loadOptions,
    handleSubmit,
  };
}
