import { useState, useCallback } from "react";

function validate(formState) {
  const errors = [];
  if (!formState.description?.trim())
    errors.push("Description est obligatoire");
  const c = Number(formState.complexity);
  if (!formState.complexity || c < 1 || c > 10)
    errors.push("Complexité doit être entre 1 et 10");
  if (c > 5 && formState.complexityFactors.length === 0)
    errors.push(
      "Au moins un facteur de complexité est requis pour complexité > 5",
    );
  return errors;
}

export function useActionForm(initialState = {}) {
  const [formState, setFormState] = useState({
    time: initialState.time ?? "",
    date: initialState.date ?? new Date().toISOString().split("T")[0],
    category: initialState.category ?? "",
    description: initialState.description ?? "",
    complexity: initialState.complexity ?? "",
    complexityFactors: initialState.complexityFactors ?? [],
  });
  const [validationErrors, setValidationErrors] = useState([]);

  const set = useCallback(
    (field, value) => setFormState((p) => ({ ...p, [field]: value })),
    [],
  );

  const handleComplexityFactorToggle = useCallback((code) => {
    setFormState((p) => ({
      ...p,
      complexityFactors: p.complexityFactors.includes(code)
        ? p.complexityFactors.filter((c) => c !== code)
        : [...p.complexityFactors, code],
    }));
  }, []);

  const handleComplexityFactorSet = useCallback((code) => {
    setFormState((p) => ({ ...p, complexityFactors: code ? [code] : [] }));
  }, []);

  const handleValidate = useCallback(() => {
    const errors = validate(formState);
    setValidationErrors(errors);
    return errors.length === 0;
  }, [formState]);

  const handleReset = useCallback(() => {
    setFormState({
      time: "",
      date: new Date().toISOString().split("T")[0],
      category: "",
      description: "",
      complexity: "",
      complexityFactors: [],
    });
    setValidationErrors([]);
  }, []);

  return {
    formState,
    handlers: {
      handleTimeChange: (v) => set("time", v),
      handleDateChange: (v) => set("date", v),
      handleCategoryChange: (v) => set("category", v),
      handleDescriptionChange: (v) => set("description", v),
      handleComplexityChange: (v) => set("complexity", v),
      handleComplexityFactorToggle,
      handleComplexityFactorSet,
      handleReset,
      handleValidate,
    },
    validation: {
      errors: validationErrors,
      isValid: validationErrors.length === 0,
      shouldShowComplexityFactors: Number(formState.complexity) > 5,
    },
  };
}
