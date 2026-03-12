/**
 * @fileoverview Hook pour le détail d'une demande d'intervention et ses transitions
 * @module hooks/intervention-requests/useInterventionRequestDetail
 */

import { useCallback, useEffect, useState } from 'react';
import {
  fetchInterventionRequest,
  transitionInterventionRequest,
} from '@/api/intervention-requests';

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
      setError(err.message || 'Impossible de charger la demande');
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
   * @param {string} [notes] - Notes (obligatoire pour 'rejetee')
   * @returns {Promise<Object>} Demande mise à jour
   */
  const doTransition = useCallback(
    async (statusTo, notes) => {
      setTransitioning(true);
      setTransitionError(null);

      try {
        const updated = await transitionInterventionRequest(requestId, { statusTo, notes });
        setDetail(updated);
        return updated;
      } catch (err) {
        const msg = err.message || 'Transition impossible';
        setTransitionError(msg);
        throw err;
      } finally {
        setTransitioning(false);
      }
    },
    [requestId]
  );

  return { detail, loading, error, transitioning, transitionError, doTransition, refetch: load };
}
