import { useEffect, useState } from 'react';
import { stats } from '@/lib/api/facade';

const normalizeTimeBreakdown = (timeBreakdown = {}) => ({
  PROD: Number(timeBreakdown.PROD ?? 0),
  DEP: Number(timeBreakdown.DEP ?? 0),
  PILOT: Number(timeBreakdown.PILOT ?? 0),
  FRAG: Number(timeBreakdown.FRAG ?? 0),
});

const normalizeServiceStatus = (payload = {}) => {
  const timeBreakdown = normalizeTimeBreakdown(payload.timeBreakdown || {});
  const totalHours =
    typeof payload.totalHours === 'number'
      ? payload.totalHours
      : Object.values(timeBreakdown).reduce((sum, value) => sum + value, 0);

  const fragPercent =
    typeof payload.fragPercent === 'number'
      ? payload.fragPercent
      : totalHours > 0
        ? (timeBreakdown.FRAG / totalHours) * 100
        : 0;

  const pilotPercent =
    typeof payload.pilotPercent === 'number'
      ? payload.pilotPercent
      : totalHours > 0
        ? (timeBreakdown.PILOT / totalHours) * 100
        : 0;

  return {
    chargePercent: Number(payload.chargePercent ?? 0),
    fragPercent,
    pilotPercent,
    shortActionsPercent: Number(payload.shortActionsPercent ?? 0),
    timeBreakdown,
    totalHours,
    fragmentation: {
      total: timeBreakdown.FRAG,
      items: Array.isArray(payload.fragmentation?.items) ? payload.fragmentation.items : [],
      status: payload.fragmentation?.status,
    },
    siteConsumption: {
      totalServiceHours: totalHours,
      totalFragHours: timeBreakdown.FRAG,
      items: Array.isArray(payload.siteConsumption?.items) ? payload.siteConsumption.items : [],
    },
    statuses: payload.statuses,
  };
};

export function useServiceData(startDate, endDate) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await stats.fetchServiceStatus({ startDate, endDate });
        const normalized = normalizeServiceStatus(response);

        if (isMounted) {
          setData(normalized);
        }
      } catch (err) {
        console.error('useServiceData - Error:', err);
        if (isMounted) {
          setError(err);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [startDate, endDate]);

  return { data, loading, error };
}
