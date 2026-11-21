/**
 * @fileoverview Onglet et période de la page Bilan du service, gardés dans l'URL
 * (?tab=service|audit|qualite, ?months=3|6|12|24)
 * @module hooks/bilan/useBilanParams
 */

import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parseMonths, resolveTab } from '@/hooks/bilan/bilanParams';

/**
 * @param {boolean} canAudit - droit de lire l'onglet Audit
 * @returns {{ tab: string, months: number, setTab: Function, setMonths: Function }}
 */
export function useBilanParams(canAudit) {
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = resolveTab(searchParams.get('tab'), canAudit);
  const months = parseMonths(searchParams.get('months'));

  const setParam = useCallback(
    (name, value) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set(name, String(value));
        return next;
      }, { replace: true });
    },
    [setSearchParams]
  );

  const setTab = useCallback((value) => setParam('tab', value), [setParam]);
  const setMonths = useCallback((value) => setParam('months', value), [setParam]);
  return { tab, months, setTab, setMonths };
}
