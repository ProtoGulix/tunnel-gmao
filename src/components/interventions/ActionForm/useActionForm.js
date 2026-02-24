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
    time: initialState.time ?? '',
    date: initialState.date ?? '',
    category: initialState.category ?? '',
    description: initialState.description ?? '',
    complexity: initialState.complexity ?? '5',
    complexityFactors: initialState.complexityFactors ?? [],
  });

  const [validationErrors, setValidationErrors] = useState([]);

  // ===== HANDLERS =====
  const handleTimeChange = useCallback((value) => {
    setFormState((prev) => ({ ...prev, time: value }));
  }, []);

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
    setFormState((prev) => {
      const isSelected = prev.complexityFactors.includes(factorId);
      return {
        ...prev,
        complexityFactors: isSelected
          ? prev.complexityFactors.filter((id) => id !== factorId)
          : [...prev.complexityFactors, factorId],
      };
    });
  }, []);

  const handleReset = useCallback(() => {
    setFormState({
      time: initialState.time ?? '',
      date: initialState.date ?? '',
      category: initialState.category ?? '',
      description: initialState.description ?? '',
      complexity: initialState.complexity ?? '5',
      complexityFactors: initialState.complexityFactors ?? [],
    });
    setValidationErrors([]);
  }, [initialState]);

  const handleValidate = useCallback(() => {
    const validation = validateFormState(formState);
    setValidationErrors(validation.errors);
    return validation.isValid;
  }, [formState]);

  // ===== RETURN =====
  return {
    formState,
    handlers: {
      handleTimeChange,
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
