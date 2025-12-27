import { useState, useCallback } from 'react';
import { useError } from '@/contexts/ErrorContext';

/**
 * Hook pour gérer les appels API avec gestion d'erreur automatique
 * 
 * @example
 * const { data, loading, error, execute } = useApiCall(fetchInterventions);
 * 
 * useEffect(() => {
 *   execute();
 * }, []);
 */
export const useApiCall = (apiFunction, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showError } = useError();

  // Extraire les options pour stabiliser les dépendances
  const disableGlobalError = options.disableGlobalError;
  const throwError = options.throwError;

  const run = useCallback(async (args = [], runOptions = {}) => {
    const { silent = false } = runOptions;

    if (!silent) {
      setLoading(true);
    }
    setError(null);

    try {
      // Normaliser args en tableau
      const argsArray = Array.isArray(args) ? args : [];
      const result = await apiFunction(...argsArray);
      setData(result);
      return result;
    } catch (err) {
      setError(err);
      
      // Afficher l'erreur globalement sauf si disabled
      if (!disableGlobalError) {
        showError(err);
      }
      
      // Re-throw si l'utilisateur veut gérer l'erreur localement
      if (throwError) {
        throw err;
      }
      
      return null;
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [apiFunction, showError, disableGlobalError, throwError]);

  const execute = useCallback((...args) => run(args, { silent: false }), [run]);
  const executeSilent = useCallback((...args) => run(args, { silent: true }), [run]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, executeSilent, reset };
};

/**
 * Hook pour gérer une mutation (create, update, delete)
 * 
 * @example
 * const { mutate, loading } = useApiMutation(createIntervention, {
 *   onSuccess: () => refetch(),
 *   successMessage: 'Intervention créée avec succès'
 * });
 */
export const useApiMutation = (mutationFunction, options = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showError } = useError();

  // Extraire les callbacks pour stabiliser les dépendances
  const onSuccess = options.onSuccess;
  const onError = options.onError;
  const disableGlobalError = options.disableGlobalError;
  const throwError = options.throwError;

  const mutate = useCallback(async (...args) => {
    setLoading(true);
    setError(null);

    try {
      const result = await mutationFunction(...args);
      
      // Callback de succès
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;
    } catch (err) {
      setError(err);
      
      // Afficher l'erreur globalement
      if (!disableGlobalError) {
        showError(err);
      }
      
      // Callback d'erreur
      if (onError) {
        onError(err);
      }
      
      if (throwError) {
        throw err;
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  }, [mutationFunction, showError, onSuccess, onError, disableGlobalError, throwError]);

  return { mutate, loading, error };
};
