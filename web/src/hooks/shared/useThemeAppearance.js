import { useCallback, useState } from 'react';

const STORAGE_KEY = 'tunnel-theme-appearance';

function readStoredAppearance() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // localStorage indisponible (navigation privée, etc.) — ignorer.
  }
  return null;
}

/**
 * Infrastructure de préférence de thème clair/sombre (persistance + détection
 * système), prête à être branchée sur un futur toggle UI. Tant qu'aucun toggle
 * n'appelle setAppearance, la valeur reste 'light' par défaut — aucun changement
 * de rendu tant que ce hook n'est pas utilisé pour piloter <Theme appearance=...>.
 */
export function useThemeAppearance() {
  const [appearance, setAppearanceState] = useState(() => readStoredAppearance() ?? 'light');

  const setAppearance = useCallback((next) => {
    setAppearanceState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Persistance best-effort — pas bloquant si indisponible.
    }
  }, []);

  const toggle = useCallback(() => {
    setAppearance(appearance === 'dark' ? 'light' : 'dark');
  }, [appearance, setAppearance]);

  return { appearance, setAppearance, toggle };
}

/** Détecte la préférence système, pour un futur mode "suivre le système". */
export function getSystemPrefersDark() {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;
}
