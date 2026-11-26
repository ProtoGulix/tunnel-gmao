/**
 * @fileoverview Chargement et actions du référentiel des constats (administration)
 * @module hooks/admin/useConstatReferentiel
 */

import { useCallback } from 'react';
import * as refApi from '@/api/adminReferentiel';
import { useConstatQuestions } from '@/hooks/admin/useAdminReferentiel';

/** `wrap(fn, message)` exécute l'action et notifie ; les choix sont imbriqués, on recharge. */
export function useConstatReferentiel(wrap) {
  const constats = useConstatQuestions();
  const act = useCallback((call, message) => (...args) =>
    wrap(async () => {
      await call(...args);
      constats.refresh();
    }, message), [constats, wrap]);

  return {
    constats,
    onUpdateQuestion: act(refApi.updateConstatQuestion, 'Question modifiée'),
    onCreateChoice: act(refApi.createConstatChoice, 'Choix créé'),
    onUpdateChoice: act(refApi.updateConstatChoice, 'Choix modifié'),
  };
}
