/**
 * @fileoverview Acceptation d'une demande depuis la file. Le rejet reste celui du panneau de
 * demande, dont le motif vient de la fenêtre d'audit commune.
 * @module hooks/home/useRequestQueueActions
 */

import { useCallback } from 'react';
import { transitionInterventionRequest } from '@/api/intervention-requests';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

export function useRequestQueueActions({ onDone }) {
  const accept = useCallback(async (request, data) => {
    try {
      await transitionInterventionRequest(request.id, { statusTo: 'acceptee', ...data });
      await onDone();
      return true;
    } catch (err) {
      // Fenêtre de motif fermée : rien n'a changé, rien à signaler.
      if (err?.isAuditCancelled) return false;
      throw new Error(extractApiErrorMessage(err, 'Transition impossible'));
    }
  }, [onDone]);

  return { accept };
}
