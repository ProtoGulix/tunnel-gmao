/**
 * @fileoverview Chargement de la synthèse de l'audit
 * @module hooks/audit-synthese/useAuditSynthese
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchAuditSynthese } from '@/api/auditSynthese';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';

/**
 * Relance la requête quand le nombre de mois change.
 * @param {number} months
 * @returns {{ data: Object|null, loading: boolean, error: string|null, reload: Function }}
 */
export function useAuditSynthese(months) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const current = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAuditSynthese({ months });
      if (current !== requestId.current) return;
      setData(result);
    } catch (err) {
      if (current !== requestId.current) return;
      setData(null);
      setError(extractApiErrorMessage(err, "Erreur lors du chargement de la synthèse de l'audit"));
    } finally {
      if (current === requestId.current) setLoading(false);
    }
  }, [months]);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}
