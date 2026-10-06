import { useEffect, useState } from 'react';
import { fetchInterventionRequestStatuses } from '@/api/intervention-requests';

let _cache = null;

export function useInterventionRequestStatuses() {
  const [statuses, setStatuses] = useState(_cache);

  useEffect(() => {
    if (_cache) return;
    fetchInterventionRequestStatuses()
      .then((data) => { _cache = data; setStatuses(data); })
      .catch(() => {});
  }, []);

  const labelMap = Object.fromEntries((statuses ?? []).map((s) => [s.code, s.label]));
  const colorMap = Object.fromEntries((statuses ?? []).map((s) => [s.code, s.color]));

  return { statuses, labelMap, colorMap };
}
