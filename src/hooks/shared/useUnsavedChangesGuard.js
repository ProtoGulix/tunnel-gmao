/**
 * @fileoverview Garde-fou générique pour ne pas perdre une édition non enregistrée.
 *
 * Intercepte : les actions internes à l'app en passant par `guard(action)`, et la
 * fermeture/rechargement de l'onglet navigateur via `beforeunload`.
 * N'intercepte pas la navigation React Router (BrowserRouter classique, pas de
 * data router ici donc useBlocker indisponible) — seulement les cas explicitement
 * gérés par l'appelant (ex: clic sur une autre ligne de liste, bouton Annuler).
 *
 * @module hooks/shared/useUnsavedChangesGuard
 */
import { useCallback, useEffect, useState } from 'react';

export function useUnsavedChangesGuard(isDirty) {
  const [pendingAction, setPendingAction] = useState(null);

  useEffect(() => {
    if (!isDirty) return undefined;
    const handler = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const guard = useCallback((action) => {
    if (isDirty) { setPendingAction(() => action); return; }
    action();
  }, [isDirty]);

  const confirmDiscard = useCallback(() => {
    setPendingAction((action) => { action?.(); return null; });
  }, []);

  const cancelDiscard = useCallback(() => setPendingAction(null), []);

  return {
    guard,
    isConfirmOpen: pendingAction !== null,
    confirmDiscard,
    cancelDiscard,
  };
}
