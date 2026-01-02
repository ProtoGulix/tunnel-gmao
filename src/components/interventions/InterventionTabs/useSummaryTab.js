import { useState, useCallback } from 'react';

/**
 * Hook pour gérer l'état de SummaryTab
 * Gère : visibilité formulaire, état submission
 */
export function useSummaryTab(interventionId) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleToggleForm = useCallback(() => {
    setShowForm((prev) => !prev);
  }, []);

  const handleSubmit = useCallback(
    async (formData, onCreatePurchaseRequest) => {
      try {
        setSubmitting(true);
        await onCreatePurchaseRequest({
          ...formData,
          intervention_id: interventionId,
        });
        setShowForm(false);
      } finally {
        setSubmitting(false);
      }
    },
    [interventionId]
  );

  const handleCancel = useCallback(() => {
    setShowForm(false);
  }, []);

  return {
    showForm,
    submitting,
    handlers: {
      toggleForm: handleToggleForm,
      submit: handleSubmit,
      cancel: handleCancel,
    },
  };
}
