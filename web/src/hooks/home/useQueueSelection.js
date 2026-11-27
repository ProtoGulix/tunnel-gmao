/**
 * @fileoverview Sélection de la file dans l'adresse (`?sel=`). Une ligne décidée disparaît du
 * rechargement : la sélection passe alors à la suivante (voir nextSelection).
 * @module hooks/home/useQueueSelection
 */

import { useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { nextSelection } from '@/hooks/home/requestQueue';

const PARAM = 'sel';

/** frozen : une source de la file a échoué, ses lignes manquent sans avoir été décidées */
export function useQueueSelection(keys, frozen = false) {
  const [searchParams, setSearchParams] = useSearchParams();
  const selected = searchParams.get(PARAM);
  const previousKeys = useRef([]);

  const select = useCallback((key) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (key) next.set(PARAM, key);
      else next.delete(PARAM);
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  useEffect(() => {
    if (frozen) return;
    const next = nextSelection(previousKeys.current, keys, selected);
    previousKeys.current = keys;
    if (next !== selected) select(next);
  }, [keys, selected, select, frozen]);

  return [selected, select];
}
