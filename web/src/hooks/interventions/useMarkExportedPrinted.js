/**
 * Marquage « imprimées » des fiches d'un export de masse réussi.
 * Le marquage ne vaut que pour les critères du dernier export : si la période ou
 * l'équipement changent ensuite, il n'est plus proposé.
 */

import { useState } from 'react';
import { markClosedInterventionsPrinted } from '@/api/interventions';

// « 3 fiches marquées imprimées », complété des fiches de l'export qui l'étaient déjà
function formatMarkResult(marked, total) {
  const main = `${marked} ${marked > 1 ? 'fiches marquées imprimées' : 'fiche marquée imprimée'}`;
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

  const markPrinted = async () => {
    setMarkError(null);
    setMarking(true);
    try {
      const { marked, total } = await markClosedInterventionsPrinted({
        dateFrom, dateTo, equipementId, includePrinted,
      });
      setMarkResult(formatMarkResult(marked, total));
      onMarked?.();
    } catch (err) {
      setMarkError(err.message);
    } finally {
      setMarking(false);
    }
  };

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
    resetMark,
    setExportedKey,
  };
}
