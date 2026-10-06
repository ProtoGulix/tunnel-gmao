/**
 * @fileoverview Hook pour gérer les notifications temporaires
 * @module hooks/shared/useNotification
 */

import { useState, useCallback } from 'react';

/**
 * Hook générique pour gérer les notifications temporaires
 * Simplifie le pattern répétitif de notification + setTimeout
 *
 * @param {number} [defaultDuration=3000] - Durée par défaut en ms
 * @returns {Object} - Fonctions pour afficher des notifications
 *
 * @example
 * const { notify } = useNotification();
 * notify('Action effectuée'); // success par défaut
 * notify('Erreur survenue', 'error');
 */
export function useNotification(defaultDuration = 3000) {
  const [notification, setNotification] = useState(null);

  const notify = useCallback(
    (message, type = 'success') => {
      setNotification({ type, message });

      const duration = type === 'error' ? 6000 : defaultDuration;
      if (duration > 0) {
        setTimeout(() => setNotification(null), duration);
      }
    },
    [defaultDuration]
  );

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    notification,
    notify,
    clearNotification,
  };
}
