/**
 * @fileoverview Site et filtre du bilan dans l'adresse (`?site=`, `?f=`). Changer de filtre
 * efface la sélection de la liste (`?sel=`).
 * @module hooks/home/useHomeFilter
 */

import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parseFilter, formatFilter } from '@/hooks/home/bilanFilter';

const ID = /^[\w-]+$/;

export function useHomeFilter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawSite = searchParams.get('site') ?? '';
  const site = ID.test(rawSite) ? rawSite : '';
  const rawFilter = searchParams.get('f');
  const filter = useMemo(() => parseFilter(rawFilter), [rawFilter]);

  const update = useCallback((changes) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(changes)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      next.delete('sel');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setFilter = useCallback((f) => update({ f: formatFilter(f) }), [update]);
  // Un filtre d'équipement ou de site d'un autre site ne tient plus : il saute avec le site
  const setSite = useCallback((value) => update({ site: value, f: '' }), [update]);

  return { site, filter, setFilter, setSite };
}
