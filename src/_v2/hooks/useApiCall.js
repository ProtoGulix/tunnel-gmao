import { useState, useCallback, useEffect, useRef } from 'react';
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
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  // Extraire les options pour stabiliser les dépendances
  const { disableGlobalError, throwError } = options;

  // Cleanup: annuler les requêtes en cours lors du démontage
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      const controller = abortControllerRef.current;
      if (controller) {
        controller.abort();
      }
    };
  }, []);

  const run = useCallback(
    async (args = [], runOptions = {}) => {
      const { silent = false } = runOptions;

      // Créer un AbortController LOCAL pour CETTE requête uniquement
      const localController = new AbortController();
      const currentSignal = localController.signal;
      abortControllerRef.current = localController;

      if (!silent && isMountedRef.current) {
        setLoading(true);
      }
      if (isMountedRef.current) {
        setError(null);
      }

      try {
        // Normaliser args en tableau
        const argsArray = Array.isArray(args) ? args : [];
        const result = await apiFunction(...argsArray);

        // Ne pas mettre à jour le state si la requête a été annulée OU si result est null (annulation dans apiCall)
        if (!currentSignal.aborted && result !== null && isMountedRef.current) {
          setData(result);
        }

        return result;
      } catch (err) {
        // Ignorer silencieusement les erreurs d'annulation (navigation React Router)
        if (err?.name === 'NetworkError' && err?.details?.canceled) {
          return null;
        }

        // Vérifier si la requête a été annulée avant de mettre à jour le state
        if (!currentSignal.aborted && isMountedRef.current) {
          setError(err);

          // Afficher l'erreur globalement sauf si disabled
          if (!disableGlobalError) {
            showError(err);
          }
        }

        // Re-throw si l'utilisateur veut gérer l'erreur localement
        if (throwError) {
          throw err;
        }

        return null;
      } finally {
        if (!silent && isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    [apiFunction, showError, disableGlobalError, throwError]
  );

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
 *   successMessage: 'Intervention créée avec succès',
 *   notify: showNotification,
 * });
 */
export const useApiMutation = (mutationFunction, options = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { showError } = useError();

  // Extraire les callbacks pour stabiliser les dépendances
  const {
    onSuccess,
    onError,
    disableGlobalError,
    throwError,
    notify,
    successMessage,
    errorMessage,
    successDetails,
    errorDetails,
    successType = 'success',
    errorType = 'error',
  } = options;

  const resolveMessage = useCallback((value, ...params) => {
    if (typeof value === 'function') {
      return value(...params);
    }
    return value;
  }, []);

  const notifyMessage = useCallback(
    (type, message, details) => {
      if (!notify || !message) return;

      const payload = details ? { details } : {};

      if (typeof notify === 'function') {
        notify(message, type, payload);
        return;
      }

      if (notify.showNotification) {
        notify.showNotification(message, type, payload);
        return;
      }

      const handlers = {
        success: notify.showSuccess,
        warning: notify.showWarning,
        info: notify.showInfo,
        error: notify.showError,
      };

      const handler = handlers[type];
      if (handler) {
        handler(message, payload);
      }
    },
    [notify]
  );

  const mutate = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);

      try {
        const result = await mutationFunction(...args);

        // Callback de succès
        if (onSuccess) {
          onSuccess(result, ...args);
        }

        const resolvedSuccessMessage = resolveMessage(successMessage, result, ...args);
        const resolvedSuccessDetails = resolveMessage(successDetails, result, ...args);
        notifyMessage(successType, resolvedSuccessMessage, resolvedSuccessDetails);

        return result;
      } catch (err) {
        setError(err);

        // Afficher l'erreur globalement
        if (!disableGlobalError) {
          showError(err);
        }

        // Callback d'erreur
        if (onError) {
          onError(err, ...args);
        }

        const resolvedErrorMessage = resolveMessage(errorMessage, err, ...args);
        const resolvedErrorDetails = resolveMessage(errorDetails, err, ...args);
        notifyMessage(errorType, resolvedErrorMessage, resolvedErrorDetails);

        if (throwError) {
          throw err;
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    [
      mutationFunction,
      showError,
      onSuccess,
      onError,
      disableGlobalError,
      throwError,
      resolveMessage,
      notifyMessage,
      successMessage,
      successDetails,
      successType,
      errorMessage,
      errorDetails,
      errorType,
    ]
  );

  return { mutate, loading, error };
};
