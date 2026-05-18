/**
 * useAuditGuard — abonne le composant aux erreurs d'audit interceptées par axios.
 *
 * Quand le backend répond AUDIT_REASON_REQUIRED, l'intercepteur client.js appelle
 * handleAuditError() qui suspend la requête et notifie les abonnés via onAuditRequired().
 * Ce hook reçoit la notification, ouvre AuditReasonDialog, collecte la raison
 * et résout la promesse suspendue — la requête repart automatiquement.
 *
 * Aucune modification des services API ou des hooks métier n'est nécessaire.
 *
 * Usage :
 *   const { auditProps } = useAuditGuard();
 *   <AuditGuardDialog {...auditProps} />
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { onAuditRequired } from '@/lib/api/auditGuard';

export function useAuditGuard() {
  const [dialogState, setDialogState] = useState({
    open: false,
    entityType: null,
    saving: false,
  });

  const pendingRef = useRef(null);

  useEffect(() => {
    return onAuditRequired(({ entityType, resolve, reject }) => {
      pendingRef.current = { resolve, reject };
      setDialogState({ open: true, entityType, saving: false });
    });
  }, []);

  const handleConfirm = useCallback(async (reason) => {
    if (!pendingRef.current) return;
    setDialogState((s) => ({ ...s, saving: true }));
    pendingRef.current.resolve(reason);
    pendingRef.current = null;
    setDialogState({ open: false, entityType: null, saving: false });
  }, []);

  const handleCancel = useCallback(() => {
    if (pendingRef.current) {
      pendingRef.current.reject();
      pendingRef.current = null;
    }
    setDialogState({ open: false, entityType: null, saving: false });
  }, []);

  return {
    auditProps: {
      open: dialogState.open,
      entityType: dialogState.entityType,
      saving: dialogState.saving,
      onConfirm: handleConfirm,
      onCancel: handleCancel,
    },
  };
}
