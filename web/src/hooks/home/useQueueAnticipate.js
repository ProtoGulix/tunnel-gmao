/**
 * @fileoverview « Lancer en avance » depuis la file : le plan et la machine viennent de la ligne
 * (le hook des équipements est lié à une seule machine).
 * @module hooks/home/useQueueAnticipate
 */

import { useCallback, useState } from 'react';
import { anticipatePreventiveOccurrence } from '@/api/preventiveOccurrences';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

export function useQueueAnticipate({ onDone }) {
  const [pendingKey, setPendingKey] = useState(null);
  const [error, setError] = useState(null);

  const anticipate = useCallback(async (row) => {
    setPendingKey(`${row.plan_id}:${row.machine_id}`);
    setError(null);
    try {
      await anticipatePreventiveOccurrence(row.plan_id, row.machine_id);
      await onDone();
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Le lancement en avance a échoué'));
    } finally {
      setPendingKey(null);
    }
  }, [onDone]);

  return { anticipate, pendingKey, error };
}
