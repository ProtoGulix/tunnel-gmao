import { useState, useCallback } from 'react';
import { fetchInterventions } from '@/api/interventions';
import { fetchTasksWorkspace } from '@/api/tasks';
import { extractApiErrorMessage } from '@/lib/api/errorMessage';
import { useEffect } from 'react';

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

function enrichSituation(iv, tasks) {
  const daysOpen = getDaysOpen(iv.reportedDate);
  const tasksLinked = tasks.filter((t) => String(t.intervention?.id) === String(iv.id));
  const ac = iv.stats?.actionCount ?? 0;
  const pc = iv.stats?.purchaseCount ?? 0;

  return {
    ...iv,
    daysOpen,
    tasksLinked,
    hasDecision: iv.priority === 'urgent' && ac === 0,
    hasPiece: pc > 0,
    isNominal: ac > 0 && pc === 0,
  };
}

function classifySections(enriched) {
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

  // Tri section 1 : decision en premier, puis blocked_piece, puis reported_date ASC
  nowItems.sort((a, b) => {
    if (a.situationType !== b.situationType) {
      return a.situationType === 'decision' ? -1 : 1;
    }
    return new Date(a.reportedDate) - new Date(b.reportedDate);
  });

  // Section 2 — Attente pièces
  enriched.forEach((s) => {
    if (nowSet.has(s.id)) return;
    const pc = s.stats?.purchaseCount ?? 0;
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

  // Tri section 3 : due_date ASC des tâches liées, puis reportedDate ASC
  runningItems.sort((a, b) => {
    const aTask = a.tasksLinked.find((t) => t.due_date);
    const bTask = b.tasksLinked.find((t) => t.due_date);
    if (aTask && bTask) return new Date(aTask.due_date) - new Date(bTask.due_date);
    if (aTask) return -1;
    if (bTask) return 1;
    return new Date(a.reportedDate) - new Date(b.reportedDate);
  });

  return [
    { id: 'now', label: 'À traiter maintenant', items: nowItems },
    { id: 'waiting', label: 'Attente pièces — surveiller', items: waitingItems },
    { id: 'running', label: 'En cours — nominal', items: runningItems },
  ];
}

function computeCounters(interventions, tasksCounters) {
  return {
    critical: interventions.filter((iv) => iv.machine?.health?.level === 'critical').length,
    blocked_piece: interventions.filter((iv) => (iv.stats?.purchaseCount ?? 0) > 0).length,
    decision: interventions.filter(
      (iv) => iv.priority === 'urgent' && (iv.stats?.actionCount ?? 0) === 0
    ).length,
    in_progress: tasksCounters?.in_progress ?? 0,
    preventive: tasksCounters?.todo ?? 0,
  };
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useBriefingData() {
  const [sections, setSections] = useState([]);
  const [counters, setCounters] = useState({
    critical: 0,
    blocked_piece: 0,
    decision: 0,
    in_progress: 0,
    preventive: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [interventionsResult, tasksResult] = await Promise.allSettled([
      fetchInterventions({
        status: 'ouvert,en_cours',
        include: 'stats',
        sort: '-priority,-reported_date',
        limit: 200,
      }),
      fetchTasksWorkspace({
        status: 'todo,in_progress',
        include_counters: true,
        limit: 200,
      }),
    ]);

    const interventions =
      interventionsResult.status === 'fulfilled' ? interventionsResult.value : [];
    const tasksData =
      tasksResult.status === 'fulfilled' ? tasksResult.value : { items: [], counters: null };
    const tasks = (tasksData.items ?? []).flatMap((group) =>
      (group.tasks ?? []).map((t) => ({ ...t, intervention: { id: group.id } }))
    );
    const tasksCounters = tasksData.counters ?? null;

    if (interventionsResult.status === 'rejected' && tasksResult.status === 'rejected') {
      setError(
        extractApiErrorMessage(interventionsResult.reason, 'Erreur lors du chargement des données')
      );
      setLoading(false);
      return;
    }

    const enriched = interventions.map((iv) => enrichSituation(iv, tasks));
    const newSections = classifySections(enriched);
    const newCounters = computeCounters(interventions, tasksCounters);

    setSections(newSections);
    setCounters(newCounters);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { sections, counters, loading, error, retry: fetchData };
}
