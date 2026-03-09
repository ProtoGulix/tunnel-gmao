/**
 * @fileoverview Hook centralisant l'état d'une requête API
 * @module hooks/shared/useApiStatus
 *
 * @example
 * const { status, error, wrap, reset } = useApiStatus();
 *
 * // status: 'idle' | 'loading' | 'success' | 'error'
 * const handleSave = () => wrap(() => api.put('/stock-items/' + id, payload));
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { emitSystemError, clearSystemError } from '@/lib/api/systemErrors';

/** Erreurs sans réponse HTTP (réseau, timeout) ou 5xx → niveau 3 banneau layout */
function isSystemError(err) {
  if (!err?.response) return true;
  return err.response.status >= 500;
}

export function useApiStatus() {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const wrap = useCallback(async (fn) => {
    setStatus('loading');
    setError(null);
    try {
      const result = await fn();
      if (mounted.current) {
        setStatus('success');
        clearSystemError();
        setTimeout(() => {
          if (mounted.current) setStatus('idle');
        }, 1500);
      }
      return result;
    } catch (err) {
      if (mounted.current) {
        setStatus('error');
        setError(err);
      }
      if (isSystemError(err)) emitSystemError(err);
    }
  }, []);

  /** Remet à zéro le statut — utile sur interaction utilisateur (Level 2) */
  const reset = useCallback(() => {
    if (mounted.current) {
      setStatus('idle');
      setError(null);
    }
  }, []);

  return { status, error, wrap, reset };
}
