/**
 * @fileoverview Hook pour le détail d'une demande d'intervention et ses transitions
 * @module hooks/intervention-requests/useInterventionRequestDetail
 */

import { useCallback, useEffect, useState } from 'react';
import {
  fetchInterventionRequest,
  transitionInterventionRequest,
  deleteInterventionRequest,
} from '@/api/intervention-requests';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

/**
 * Charge le détail complet d'une demande et expose les fonctions de transition/suppression.
 *
 * @param {string|null} requestId - UUID de la demande à charger
 * @returns {Object} { detail, loading, error, transitioning, transitionError, doTransition, deleting, deleteError, doDelete, refetch }
 */
export function useInterventionRequestDetail(requestId) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionError, setTransitionError] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const load = useCallback(async () => {
    if (!requestId) return;
    setLoading(true);
    setError(null);

    try {
      const data = await fetchInterventionRequest(requestId);
      setDetail(data);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Impossible de charger la demande'));
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    setDetail(null);
    load();
  }, [load]);

  /**
   * Effectue une transition de statut. Si le backend exige une raison d'audit (reason_code
   * manquant), l'audit guard global (useAuditGuard / AuditGuardDialog, monté dans Layout.jsx)
   * intercepte automatiquement la requête, affiche son popup, et la rejoue lui-même —
   * comme pour toute autre mutation du projet. Rien à gérer ici de ce côté.
   *
   * @param {string} statusTo - Code du statut cible
   * @param {Object} [extraData] - notes, typeInter, techInitials, priority, reportedDate
   * @returns {Promise<Object>} Demande mise à jour
   */
  const doTransition = useCallback(
    async (statusTo, extraData = {}) => {
      setTransitioning(true);
      setTransitionError(null);

      try {
        const updated = await transitionInterventionRequest(requestId, { statusTo, ...extraData });
        setDetail(updated);
        return updated;
      } catch (err) {
        // Annulation volontaire de l'audit guard : pas d'erreur affichée, le flag est
        // préservé pour que l'appelant puisse distinguer ce cas d'un vrai échec métier.
        if (err?.isAuditCancelled) {
          const cancelled = new Error('AUDIT_CANCELLED');
          cancelled.isAuditCancelled = true;
          throw cancelled;
        }
        const msg = extractApiErrorMessage(err, 'Transition impossible');
        setTransitionError(msg);
        throw new Error(msg);
      } finally {
        setTransitioning(false);
      }
    },
    [requestId]
  );

  /**
   * Supprime définitivement la demande (erreur de saisie, doublon).
   * @returns {Promise<void>}
   */
  const doDelete = useCallback(async () => {
    setDeleting(true);
    setDeleteError(null);

    try {
      await deleteInterventionRequest(requestId);
    } catch (err) {
      const msg = extractApiErrorMessage(err, 'Suppression impossible');
      setDeleteError(msg);
      throw new Error(msg);
    } finally {
      setDeleting(false);
    }
  }, [requestId]);

  return {
    detail, loading, error, transitioning, transitionError, doTransition,
    deleting, deleteError, doDelete, refetch: load,
  };
}
