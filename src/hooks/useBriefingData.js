import { useState, useCallback, useEffect } from 'react';
import { fetchInterventions } from '@/api/interventions';
import { fetchInterventionRequests } from '@/api/intervention-requests';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';
import { getInterventionUrgency } from '@/hooks/useInterventionUrgency';

// ── Helpers ────────────────────────────────────────────────────────────────

const today = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

function getDaysOpen(reportedDate) {
  if (!reportedDate) return 0;
  return Math.floor((today - new Date(reportedDate)) / 86400000);
}

function enrichSituation(iv) {
  const daysOpen = getDaysOpen(iv.reportedDate);
  const tasksLinked = Array.isArray(iv.tasks) ? iv.tasks : [];
  const ac = iv.stats?.actionCount ?? 0;
  const pc = iv.stats?.purchasePending ?? iv.stats?.purchaseCount ?? 0;
  const urgency = getInterventionUrgency(iv.next_due_date, iv.reportedDate);

  return {
    ...iv,
    daysOpen,
    tasksLinked,
    urgency,
    hasDecision: iv.priority === 'urgent' && ac === 0,
    hasPiece: pc > 0,
    isNominal: ac > 0 && pc === 0,
  };
}

function classifySections(enriched, { includeAll = false } = {}) {
  const nowItems = [];
  const waitingItems = [];
  const runningItems = [];
  const nowSet = new Set();
  const waitingSet = new Set();

  // Section 1 — À traiter maintenant
  enriched.forEach((s) => {
    const ac = s.stats?.actionCount ?? 0;
    const pc = s.stats?.purchaseCount ?? 0;
    const isUrgent = s.priority === 'urgent';
    const isCritical = s.machine?.health?.level === 'critical';

    let situationType = null;
    if (isUrgent && ac === 0) {
      situationType = 'decision';
    } else if (isUrgent && pc > 0) {
      situationType = 'blocked_piece';
    } else if (isCritical && ac === 0) {
      situationType = 'decision';
    }

    if (situationType) {
      nowItems.push({ ...s, situationType });
      nowSet.add(s.id);
    }
  });

  // Tri section 1 : decision en premier, puis next_due_date ASC (overdue/urgent en tête), puis reported_date
  nowItems.sort((a, b) => {
    if (a.situationType !== b.situationType) {
      return a.situationType === 'decision' ? -1 : 1;
    }
    const aHasDue = a.next_due_date != null;
    const bHasDue = b.next_due_date != null;
    if (aHasDue && bHasDue) return new Date(a.next_due_date) - new Date(b.next_due_date);
    if (aHasDue) return -1;
    if (bHasDue) return 1;
    return new Date(a.reportedDate) - new Date(b.reportedDate);
  });

  // Section 2 — Attente pièces
  enriched.forEach((s) => {
    if (nowSet.has(s.id)) return;
    const pc = s.stats?.purchasePending ?? s.stats?.purchaseCount ?? 0;
    if (pc > 0) {
      waitingItems.push({ ...s, situationType: 'blocked_piece' });
      waitingSet.add(s.id);
    }
  });

  // Tri section 2 : daysOpen DESC (les plus longues en attente en premier)
  waitingItems.sort((a, b) => b.daysOpen - a.daysOpen);

  // Section 3 — En cours nominal
  enriched.forEach((s) => {
    if (nowSet.has(s.id) || waitingSet.has(s.id)) return;
    const ac = s.stats?.actionCount ?? 0;
    const pc = s.stats?.purchaseCount ?? 0;
    const hasInProgressTask = s.tasksLinked.some((t) => t.status === 'in_progress');

    if ((ac > 0 && pc === 0) || hasInProgressTask) {
      runningItems.push({ ...s, situationType: 'in_progress' });
    }
  });

  // Tri section 3 : next_due_date ASC (champ intervention), puis reported_date ASC
  runningItems.sort((a, b) => {
    const aHasDue = a.next_due_date != null;
    const bHasDue = b.next_due_date != null;
    if (aHasDue && bHasDue) return new Date(a.next_due_date) - new Date(b.next_due_date);
    if (aHasDue) return -1;
    if (bHasDue) return 1;
    return new Date(a.reportedDate) - new Date(b.reportedDate);
  });

  const sections = [
    { id: 'now', label: 'À traiter maintenant', items: nowItems },
    { id: 'waiting', label: 'Attente pièces — surveiller', items: waitingItems },
    { id: 'running', label: 'En cours — nominal', items: runningItems },
  ];

  if (includeAll) {
    const classifiedIds = new Set([
      ...nowSet,
      ...waitingSet,
      ...runningItems.map((i) => i.id),
    ]);
    const uncategorized = enriched
      .filter((s) => !classifiedIds.has(s.id))
      .sort((a, b) => new Date(b.reportedDate) - new Date(a.reportedDate))
      .map((s) => ({ ...s, situationType: 'in_progress' }));
    if (uncategorized.length > 0) {
      sections.push({ id: 'open', label: 'Ouvertes', items: uncategorized });
    }
  }

  return sections;
}

function buildRequestsSection(requests) {
  return {
    id: 'requests',
    label: 'Demandes en attente',
    type: 'requests',
    items: requests
      .filter((r) => r.statut === 'nouvelle' || r.statut === 'en_attente')
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
  };
}

function computeCounters(interventions, requests) {
  return {
    critical: interventions.filter((iv) => iv.machine?.health?.level === 'critical').length,
    blocked_piece: interventions.filter((iv) => (iv.stats?.purchasePending ?? iv.stats?.purchaseCount ?? 0) > 0).length,
    decision: interventions.filter(
      (iv) => iv.priority === 'urgent' && (iv.stats?.actionCount ?? 0) === 0
    ).length,
    in_progress: interventions.reduce((sum, iv) => sum + (iv.stats?.taskProgress?.in_progress ?? 0), 0),
    preventive: interventions.reduce((sum, iv) => sum + (iv.stats?.taskProgress?.todo ?? 0), 0),
    requests: requests.filter((r) => r.statut === 'nouvelle' || r.statut === 'en_attente').length,
  };
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useBriefingData({ equipementId } = {}) {
  const [sections, setSections] = useState([]);
  const [counters, setCounters] = useState({
    critical: 0,
    blocked_piece: 0,
    decision: 0,
    in_progress: 0,
    preventive: 0,
    requests: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const interventionParams = {
      include: 'stats,tasks',
      sort: '-priority,-reported_date',
      limit: 500,
    };
    if (equipementId) {
      interventionParams.equipementId = equipementId;
    } else {
      interventionParams.status = 'ouvert,en_cours';
      interventionParams.limit = 200;
    }

    const fetches = [fetchInterventions(interventionParams)];
    if (!equipementId) {
      fetches.push(fetchInterventionRequests({
        excludeStatuses: 'rejetee,cloturee,acceptee',
        limit: 200,
      }));
    }

    const [interventionsResult, requestsResult] = await Promise.allSettled(fetches);

    const interventions =
      interventionsResult.status === 'fulfilled' ? interventionsResult.value : [];
    const requests =
      !equipementId && requestsResult?.status === 'fulfilled'
        ? (requestsResult.value.items ?? [])
        : [];

    if (interventionsResult.status === 'rejected') {
      setError(
        extractApiErrorMessage(interventionsResult.reason, 'Erreur lors du chargement des données')
      );
      setLoading(false);
      return;
    }

    const enriched = interventions.map((iv) => enrichSituation(iv));
    const openEnriched = equipementId
      ? enriched.filter((iv) => iv.status !== 'ferme' && iv.status !== 'cancelled')
      : enriched;
    const classifiedSections = classifySections(openEnriched, { includeAll: !!equipementId });

    let newSections;
    if (equipementId) {
      const archived = enriched
        .filter((iv) => iv.status === 'ferme' || iv.status === 'cancelled')
        .sort((a, b) => new Date(b.reportedDate) - new Date(a.reportedDate));
      newSections = [
        ...classifiedSections,
        { id: 'archived', label: 'Archives', type: 'situation', items: archived },
      ];
    } else {
      newSections = [...classifiedSections, buildRequestsSection(requests)];
    }
    const newCounters = computeCounters(interventions, requests);

    setSections(newSections);
    setCounters(newCounters);
    setLoading(false);
  }, [equipementId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { sections, counters, loading, error, retry: fetchData };
}
