import { useCallback } from 'react';

/**
 * Hook pour gérer SheetTab
 * Gère callback de génération PDF sans mutation d'état
 */
export function useSheetTab() {
  const handleGeneratePdf = useCallback((loadPdf) => {
    loadPdf();
  }, []);

  const handleMarkPrinted = useCallback(async (isAlreadyPrinted, markPrintedCb) => {
    if (isAlreadyPrinted) return;
    const first = window.confirm("Marquer la fiche comme imprimée ?");
    if (!first) return;
    const second = window.confirm("Confirmer l'impression de la fiche ?");
    if (!second) return;
    await markPrintedCb();
  }, []);

  return {
    handlers: {
      generatePdf: handleGeneratePdf,
      markPrinted: handleMarkPrinted,
    },
  };
}
