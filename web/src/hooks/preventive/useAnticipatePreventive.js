/**
 * @fileoverview Hook « Lancer en avance » d'un plan (POST /preventive-occurrences/anticipate)
 * @module hooks/preventive/useAnticipatePreventive
 */

import { useCallback, useState } from 'react';
import { anticipatePreventiveOccurrence } from '@/api/preventiveOccurrences';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

/**
 * @param {string} machineId
 * @param {Function} onDone - appelé après un lancement réussi (rafraîchissement)
 * @returns {{ anticipate: Function, pendingPlanId: string|null, error: string|null, clearError: Function }}
 */
export function useAnticipatePreventive(machineId, onDone) {
  const [pendingPlanId, setPendingPlanId] = useState(null);
  const [error, setError] = useState(null);

  const anticipate = useCallback(async (planId) => {
    setPendingPlanId(planId);
    setError(null);
    try {
      await anticipatePreventiveOccurrence(planId, machineId);
      await onDone?.();
      return true;
    } catch (err) {
      // 409 (occurrence déjà en cours) et 422 (plan ou machine non éligible) : message du backend
      setError(extractApiErrorMessage(err, 'Le lancement en avance a échoué'));
      return false;
    } finally {
      setPendingPlanId(null);
    }
  }, [machineId, onDone]);

  return { anticipate, pendingPlanId, error, clearError: () => setError(null) };
}
