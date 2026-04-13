/**
 * Hook personnalisé pour gérer l'état et la validation d'ActionForm
 * Centralise toute la logique métier
 */

import { useState, useCallback } from 'react';
import { areComplexityFactorsRequired, validateFormState } from './actionFormUtils';

/**
 * Hook pour ActionForm
 * @param {Object} initialState - État initial optionnel
 * @returns {Object} { formState, handlers, validation }
 */
export function useActionForm(initialState = {}) {
  // ===== STATE =====
  const [formState, setFormState] = useState({
    date: initialState.date ?? '',
    category: initialState.category ?? '',
    description: initialState.description ?? '',
    complexity: initialState.complexity ?? '',
    complexityFactors: initialState.complexityFactors ?? [],
  });

  const [validationErrors, setValidationErrors] = useState([]);

  // ===== HANDLERS =====
  const handleDateChange = useCallback((value) => {
    setFormState((prev) => ({ ...prev, date: value }));
  }, []);

  const handleCategoryChange = useCallback((value) => {
    setFormState((prev) => ({ ...prev, category: value }));
  }, []);

  const handleDescriptionChange = useCallback((value) => {
    setFormState((prev) => ({ ...prev, description: value }));
  }, []);

  const handleComplexityChange = useCallback((value) => {
    setFormState((prev) => ({ ...prev, complexity: value }));
  }, []);

  const handleComplexityFactorToggle = useCallback((factorId) => {
    setFormState((prev) => ({
      ...prev,
      complexityFactors: prev.complexityFactors.includes(factorId) ? [] : [factorId],
    }));
  }, []);

  const handleReset = useCallback(() => {
    setFormState({
      date: initialState.date ?? '',
      category: initialState.category ?? '',
      description: initialState.description ?? '',
      complexity: initialState.complexity ?? '',
      complexityFactors: initialState.complexityFactors ?? [],
    });
    setValidationErrors([]);
  }, [initialState]);

  const handleValidate = useCallback(
    (timeRange = null, manualTimeSpent = '') => {
      const validation = validateFormState(formState, timeRange, manualTimeSpent);
      setValidationErrors(validation.errors);
      return validation.isValid;
    },
    [formState]
  );

  // ===== RETURN =====
  return {
    formState,
    handlers: {
      handleDateChange,
      handleCategoryChange,
      handleDescriptionChange,
      handleComplexityChange,
      handleComplexityFactorToggle,
      handleReset,
      handleValidate,
    },
    validation: {
      errors: validationErrors,
      isValid: validationErrors.length === 0,
      shouldShowComplexityFactors: areComplexityFactorsRequired(formState.complexity),
    },
  };
}
