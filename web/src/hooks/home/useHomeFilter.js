/**
 * @fileoverview Site de l'accueil direction dans l'adresse (`?site=`).
 * @module hooks/home/useHomeFilter
 */

import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

const ID = /^[\w-]+$/;

export function useHomeFilter() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawSite = searchParams.get('site') ?? '';
  const site = ID.test(rawSite) ? rawSite : '';

  const setSite = useCallback((value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set('site', value);
      else next.delete('site');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  return { site, setSite };
}
