/**
 * @fileoverview Décisions sur une demande depuis « À trancher » : accepter, mettre en attente,
 * rejeter. Le motif vient de la fenêtre d'audit commune (auditGuard), jamais d'une saisie ici.
 * @module hooks/home/useRequestQueueActions
 */

import { useCallback } from 'react';
import { transitionInterventionRequest } from '@/api/intervention-requests';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

export function useRequestQueueActions({ onDone }) {
  const decide = useCallback(async (request, statusTo, data = {}) => {
    try {
      await transitionInterventionRequest(request.id, { statusTo, ...data });
      await onDone();
      return true;
    } catch (err) {
      // Fenêtre de motif fermée : rien n'a changé, rien à signaler.
      if (err?.isAuditCancelled) return false;
      throw new Error(extractApiErrorMessage(err, 'Transition impossible'));
    }
  }, [onDone]);

  const accept = useCallback((request, data) => decide(request, 'acceptee', data), [decide]);
  const hold = useCallback((request) => decide(request, 'en_attente'), [decide]);
  const reject = useCallback((request) => decide(request, 'rejetee'), [decide]);

  return { accept, hold, reject };
}
