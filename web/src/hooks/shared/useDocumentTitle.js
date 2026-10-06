import { useEffect, useRef } from 'react';

/**
 * Met à jour le titre de l'onglet navigateur selon la page courante,
 * en conservant le suffixe version/environnement défini au démarrage
 * (ex: "TUNNEL v3.54.0 [STAGING]") pour ne pas perdre cette info de support.
 */
export function useDocumentTitle(pageTitle) {
  const baseTitleRef = useRef(document.title);

  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} — ${baseTitleRef.current}` : baseTitleRef.current;
  }, [pageTitle]);
}
