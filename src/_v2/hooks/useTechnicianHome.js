// ===== IMPORTS =====
// 1. React core
import { useEffect, useMemo, useRef } from 'react';

// 2. Hooks
import { useApiCall } from '@/hooks/useApiCall';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

// 3. API
import { interventions } from '@/lib/api/facade';

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

/** Seuil d'alerte pour interventions en cours (heures) */
const IN_PROGRESS_THRESHOLD_HOURS = 24;

/** Intervalle de rafraîchissement automatique (secondes) */
const AUTO_REFRESH_INTERVAL = 30;

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Calcule l'âge d'une intervention en heures
 * @param {string} dateString - Date ISO
 * @returns {number} Âge en heures
 */
function calculateAge(dateString) {
  if (!dateString) return 0;
  const created = new Date(dateString);
  const now = new Date();
  return Math.floor((now - created) / (1000 * 60 * 60));
}

function computeUrgentCount(allInterventions) {
  if (!Array.isArray(allInterventions)) return 0;
  return allInterventions.filter(
    (interv) => interv?.priority === 'urgent' && interv?.status === 'open'
  ).length;
}

function computeOpenInterventionsCount(allInterventions) {
  if (!Array.isArray(allInterventions)) return 0;
  return allInterventions.filter((interv) =>
    ['open', 'waiting_part', 'waiting_prod', 'in_progress'].includes(interv?.status)
  ).length;
}

function computeHygieneIssues(allInterventions) {
  const issues = {
    inProgressTooLong: [],
    closedWithoutActions: [],
    actionsWithoutTime: [],
  };

  if (!Array.isArray(allInterventions)) return issues;

  for (const interv of allInterventions) {
    if (interv?.status === 'in_progress') {
      const age = calculateAge(interv?.reportedDate || interv?.dateCreation);
      if (age > IN_PROGRESS_THRESHOLD_HOURS) {
        issues.inProgressTooLong.push(interv);
      }
    }

    if (interv?.status === 'closed') {
      const hasActions = Array.isArray(interv?.action) && interv.action.length > 0;
      if (!hasActions) {
        issues.closedWithoutActions.push(interv);
      }
    }

    if (Array.isArray(interv?.action)) {
      for (const action of interv.action) {
        if (!action?.timeSpent || action.timeSpent === 0) {
          issues.actionsWithoutTime.push({ intervention: interv, action });
        }
      }
    }
  }

  return issues;
}

function computeAnomaliesCount(hygieneIssues) {
  if (!hygieneIssues) return 0;
  return (
    (hygieneIssues.inProgressTooLong?.length || 0) +
    (hygieneIssues.closedWithoutActions?.length || 0) +
    (hygieneIssues.actionsWithoutTime?.length || 0)
  );
}

function computeServiceStatus(urgentCount) {
  return urgentCount > 0 ? 'URGENT' : 'NORMAL';
}

// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// HOOK
// ════════════════════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Logique métier et rafraîchissement pour la page Pupitre Atelier
 *
 * @returns {{
 *  loading: boolean,
 *  error: any,
 *  urgentCount: number,
 *  openInterventionsCount: number,
 *  anomaliesCount: number,
 *  serviceStatus: 'URGENT' | 'NORMAL',
 *  refetchInterventions: Function,
 *  backgroundRefetch: Function,
 * }}
 */
export default function useTechnicianHome() {
  const initialLoadRef = useRef(false);

  const {
    data: allInterventions = [],
    loading,
    error,
    execute: refetchInterventions,
    executeSilent: backgroundRefetch,
  } = useApiCall(interventions.fetchInterventions, { autoExecute: false });

  useEffect(() => {
    if (initialLoadRef.current) return;
    initialLoadRef.current = true;
    refetchInterventions();
  }, [refetchInterventions]);

  useAutoRefresh(backgroundRefetch, AUTO_REFRESH_INTERVAL, true);

  const urgentCount = useMemo(() => computeUrgentCount(allInterventions), [allInterventions]);
  const openInterventionsCount = useMemo(
    () => computeOpenInterventionsCount(allInterventions),
    [allInterventions]
  );

  const hygieneIssues = useMemo(() => computeHygieneIssues(allInterventions), [allInterventions]);
  const anomaliesCount = useMemo(() => computeAnomaliesCount(hygieneIssues), [hygieneIssues]);
  const serviceStatus = useMemo(() => computeServiceStatus(urgentCount), [urgentCount]);

  return {
    loading,
    error,
    urgentCount,
    openInterventionsCount,
    anomaliesCount,
    serviceStatus,
    refetchInterventions,
    backgroundRefetch,
  };
}
