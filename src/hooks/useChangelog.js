/**
 * useChangelog — vérifie au montage s'il y a des nouveautés non vues pour
 * l'utilisateur connecté et pilote l'ouverture manuelle de ChangelogModal.
 *
 * La modale n'est jamais ouverte automatiquement : seul un indicateur discret
 * (hasNews) signale la présence de nouveautés, à l'utilisateur de cliquer.
 *
 * Usage :
 *   const { hasNews, changelogProps, openChangelog } = useChangelog(isAuthenticated);
 *   <button onClick={openChangelog}>v{appVersion}{hasNews && <Dot />}</button>
 *   <ChangelogModal {...changelogProps} />
 */

import { useState, useCallback, useEffect } from 'react';
import { getMyChangelog, markMyChangelogSeen } from '@/api/changelog';

export function useChangelog(enabled) {
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState([]);
  const [hasNews, setHasNews] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    getMyChangelog()
      .then((data) => {
        if (cancelled) return;
        const newEntries = data?.entries || [];
        setEntries(newEntries);
        setHasNews(newEntries.length > 0);
      })
      .catch(() => {
        // Silencieux : l'absence de nouveautés ne doit jamais bloquer l'app
      });

    return () => { cancelled = true; };
  }, [enabled]);

  const openChangelog = useCallback(() => {
    setOpen(true);
  }, []);

  const handleClose = useCallback(async () => {
    setOpen(false);
    if (!hasNews) return;
    setDismissing(true);
    try {
      await markMyChangelogSeen();
      setHasNews(false);
    } catch {
      // Si le PATCH échoue, l'indicateur réapparaîtra à la prochaine connexion — acceptable
    } finally {
      setDismissing(false);
    }
  }, [hasNews]);

  return {
    hasNews,
    openChangelog,
    changelogProps: {
      open,
      entries,
      dismissing,
      onClose: handleClose,
    },
  };
}
