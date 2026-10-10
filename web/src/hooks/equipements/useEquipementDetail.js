/**
 * @fileoverview Hook pour le détail d'un équipement (panneau de la page master-detail)
 * @module hooks/equipements/useEquipementDetail
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchEquipementById } from '@/api/equipements';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

/**
 * @param {string} id - ID de l'équipement
 * @param {Object} [options]
 * @param {boolean} [options.includeDescendants] - undefined = défaut serveur (vrai si l'équipement a des filles)
 * @returns {{ equipement: Object|null, loading: boolean, error: string|null, refetch: Function, applyDetail: Function }}
 */
export function useEquipementDetail(id, { includeDescendants } = {}) {
  const [equipement, setEquipement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const current = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      // Demandes et interventions sont paginées à part (useEquipementActivity)
      const params = { interventions_limit: 1 };
      if (includeDescendants !== undefined) params.include_descendants = includeDescendants;
      const data = await fetchEquipementById(id, params);
      if (current !== requestId.current) return;
      setEquipement(data);
    } catch (err) {
      if (current !== requestId.current) return;
      setError(extractApiErrorMessage(err, "Erreur lors du chargement de l'équipement"));
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, [id, includeDescendants]);

  useEffect(() => { load(); }, [load]);

  /** Remplace le détail affiché par une réponse d'API (ex. retour d'un PATCH) */
  const applyDetail = useCallback((detail) => {
    requestId.current += 1; // une lecture en vol serait périmée
    setEquipement(detail);
    setLoading(false);
  }, []);

  return { equipement, loading, error, refetch: load, applyDetail };
}
