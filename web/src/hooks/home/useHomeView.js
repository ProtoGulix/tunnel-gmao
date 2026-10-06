/**
 * @fileoverview Résout la vue d'accueil de l'utilisateur courant.
 * @module hooks/home/useHomeView
 */

import { useState, useEffect } from 'react';
import { fetchMyHomeView } from '@/api/homeView';

const DEFAULT_VIEW = 'technicien';

/**
 * Résout la vue d'accueil assignée à l'utilisateur courant.
 * Retombe systématiquement sur 'technicien' (comportement actuel) en cas
 * d'erreur réseau ou de chargement — jamais d'écran vide/cassé à l'accueil.
 *
 * @returns {{ view: string, loading: boolean }}
 */
export function useHomeView() {
  const [view, setView] = useState(DEFAULT_VIEW);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchMyHomeView()
      .then((res) => {
        if (!cancelled) setView(res?.code || DEFAULT_VIEW);
      })
      .catch(() => {
        if (!cancelled) setView(DEFAULT_VIEW);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  return { view, loading };
}
