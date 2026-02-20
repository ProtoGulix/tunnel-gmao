import { useState, useCallback } from 'react';

/**
 * Hook générique pour gérer les notifications temporaires
 * Simplifie le pattern répétitif de setDispatchResult + setTimeout
 */
export function useNotification(defaultDuration = 3000) {
  const [notification, setNotification] = useState(null);

  const showNotification = useCallback(
    (message, type = 'success', options = {}) => {
      const { details, duration = defaultDuration, ...extra } = options;

      setNotification({
        type,
        message,
        details,
        ...extra,
      });

      if (duration > 0) {
        setTimeout(() => setNotification(null), duration);
      }
    },
    [defaultDuration]
  );

  const showSuccess = useCallback(
    (message, options = {}) => {
      showNotification(message, 'success', options);
    },
    [showNotification]
  );

  const showError = useCallback(
    (message, options = {}) => {
      showNotification(message, 'error', { duration: 6000, ...options });
    },
    [showNotification]
  );

  const showWarning = useCallback(
    (message, options = {}) => {
      showNotification(message, 'warning', { duration: 5000, ...options });
    },
    [showNotification]
  );

  const showInfo = useCallback(
    (message, options = {}) => {
      showNotification(message, 'info', options);
    },
    [showNotification]
  );

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    notification,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    clearNotification,
  };
}
