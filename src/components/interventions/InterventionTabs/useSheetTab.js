import { useCallback } from 'react';

/**
 * Hook pour gérer SheetTab
 * Gère callback de génération PDF sans mutation d'état
 */
export function useSheetTab() {
  const handleGeneratePdf = useCallback((loadPdf) => {
    loadPdf();
  }, []);

  return {
    handlers: {
      generatePdf: handleGeneratePdf,
    },
  };
}
