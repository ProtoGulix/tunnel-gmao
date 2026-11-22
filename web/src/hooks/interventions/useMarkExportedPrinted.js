/**
 * Marquage « imprimées » des fiches d'un export de masse réussi.
 * Le marquage ne vaut que pour les critères du dernier export : si la période ou
 * l'équipement changent ensuite, il n'est plus proposé.
 */

import { useState } from 'react';
import { markClosedInterventionsPrinted } from '@/api/interventions';

// « 3 fiches marquées imprimées » (ou « archivées »), complété des fiches qui l'étaient déjà
function formatMarkResult(marked, total, archived = false) {
  const plural = marked > 1;
  const label = archived
    ? (plural ? 'fiches archivées' : 'fiche archivée')
    : (plural ? 'fiches marquées imprimées' : 'fiche marquée imprimée');
  const main = `${marked} ${label}`;
  const already = (total ?? marked) - marked;
  if (already <= 0) return main;
  return `${main} ; ${already} ${already > 1 ? "l'étaient déjà" : "l'était déjà"}`;
}

export function useMarkExportedPrinted({
  currentKey, dateFrom, dateTo, equipementId, includePrinted, onMarked,
}) {
  const [exportedKey, setExportedKey] = useState(null);
  const [marking, setMarking] = useState(false);
  const [markResult, setMarkResult] = useState(null);
  const [markError, setMarkError] = useState(null);

  // Même route dans les deux cas (ADR 0040) ; archiver ne suppose aucun export préalable
  const mark = async (archived) => {
    setMarkError(null);
    setMarkResult(null);
    setMarking(true);
    try {
      const { marked, total } = await markClosedInterventionsPrinted({
        dateFrom, dateTo, equipementId, includePrinted,
      });
      setMarkResult(formatMarkResult(marked, total, archived));
      onMarked?.();
    } catch (err) {
      setMarkError(err.message);
    } finally {
      setMarking(false);
    }
  };

  const markPrinted = () => mark(false);
  const archiveWithoutExport = () => mark(true);

  // Avant chaque nouvel export : rien n'est proposé tant qu'il n'a pas réussi
  const resetMark = () => {
    setExportedKey(null);
    setMarkResult(null);
    setMarkError(null);
  };

  return {
    canMark: exportedKey === currentKey && !markResult,
    marking,
    markResult,
    markError,
    markPrinted,
    archiveWithoutExport,
    resetMark,
    setExportedKey,
  };
}
