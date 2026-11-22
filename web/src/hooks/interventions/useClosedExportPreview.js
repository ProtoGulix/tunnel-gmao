/**
 * Aperçu du nombre de fiches d'un export de masse. L'appel part 500 ms après la dernière
 * modification des critères, et seulement si les deux dates sont complètes. Une réponse
 * arrivée après un changement de critères est ignorée (résultat rangé sous sa clé).
 * `version` change après un marquage : l’aperçu est alors recalculé.
 * Le backend reste juge : le hook se contente de relayer count, max et over_limit.
 */

import { useEffect, useState } from 'react';
import { fetchClosedInterventionsPreview } from '@/api/interventions';

const DEBOUNCE_MS = 500;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isUsable(data) {
  return !!data && data.count > 0 && !data.over_limit;
}

export function useClosedExportPreview({ dateFrom, dateTo, equipementId, includePrinted, enabled, version = 0 }) {
  const [result, setResult] = useState({ key: null, data: null, error: null });
  const valid = enabled && DATE_RE.test(dateFrom) && DATE_RE.test(dateTo);
  const key = `${dateFrom}|${dateTo}|${equipementId ?? ''}|${includePrinted}|${version}`;

  useEffect(() => {
    if (!valid) return undefined;
    let stale = false;
    const timer = window.setTimeout(async () => {
      try {
        const data = await fetchClosedInterventionsPreview({ dateFrom, dateTo, equipementId, includePrinted });
        if (!stale) setResult({ key, data, error: null });
      } catch (err) {
        if (!stale) setResult({ key, data: null, error: err.message });
      }
    }, DEBOUNCE_MS);
    return () => {
      stale = true;
      window.clearTimeout(timer);
    };
  }, [valid, key, dateFrom, dateTo, equipementId, includePrinted]);

  const current = valid && result.key === key;
  return {
    preview: current ? result.data : null,
    previewError: current ? result.error : null,
    previewLoading: valid && !current,
    // Le backend juge : on lit seulement count et over_limit
    hasSelection: current && isUsable(result.data),
  };
}
