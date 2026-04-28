/**
 * @fileoverview Hook pour le détail d'une demande d'intervention et ses transitions
 * @module hooks/intervention-requests/useInterventionRequestDetail
 */

import { useCallback, useEffect, useState } from 'react';
import {
  fetchInterventionRequest,
  transitionInterventionRequest,
} from '@/api/intervention-requests';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

/**
 * Charge le détail complet d'une demande et expose la fonction de transition.
 *
 * @param {string|null} requestId - UUID de la demande à charger
 * @returns {Object} { detail, loading, error, transitioning, transitionError, doTransition, refetch }
 */
export function useInterventionRequestDetail(requestId) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const [transitionError, setTransitionError] = useState(null);

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
   * Effectue une transition de statut
   * @param {string} statusTo - Code du statut cible
   * @param {Object} [extraData] - Données complémentaires : notes, typeInter, techInitials, priority, reportedDate
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
        const msg = extractApiErrorMessage(err, 'Transition impossible');
        setTransitionError(msg);
        throw new Error(msg);
      } finally {
        setTransitioning(false);
      }
    },
    [requestId]
  );

  return { detail, loading, error, transitioning, transitionError, doTransition, refetch: load };
}
