/**
 * @fileoverview Message d'échec d'une action sur un plan préventif
 * @module hooks/preventive/usePlanActionError
 */

import { useCallback, useState } from 'react';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

export function usePlanActionError() {
  const [actionError, setActionError] = useState(null);

  // Message à l'écran, sauf annulation de la fenêtre de motif (rien à signaler).
  const reportFailure = useCallback((err, fallback) => {
    if (err?.isAuditCancelled) return;
    setActionError(extractApiErrorMessage(err, fallback));
  }, []);

  return { actionError, setActionError, reportFailure };
}
