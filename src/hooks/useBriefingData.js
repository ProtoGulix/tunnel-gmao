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

function getDaysOpen(dateStr) {
  if (!dateStr) return 0;
  return Math.floor((today - new Date(dateStr)) / 86400000);
}

const PRIORITY_ORDER = { urgent: 0, important: 1, normale: 2, faible: 3 };

// Tri universel : date due (retard d'abord) → urgence → sans intervention en dernier
function sortTileItems(a, b) {
  const aNoIv = !a.intervention && a.statut !== undefined; // DI sans intervention liée
  const bNoIv = !b.intervention && b.statut !== undefined;
  if (aNoIv !== bNoIv) return aNoIv ? 1 : -1;

  const aDue = a.intervention?.next_due_date ?? a.next_due_date ?? null;
  const bDue = b.intervention?.next_due_date ?? b.next_due_date ?? null;

  if (aDue && bDue) return new Date(aDue) - new Date(bDue);
  if (aDue) return -1;
  if (bDue) return 1;

  const aPriority = PRIORITY_ORDER[a.intervention?.priority ?? a.priority ?? 'normale'] ?? 2;
  const bPriority = PRIORITY_ORDER[b.intervention?.priority ?? b.priority ?? 'normale'] ?? 2;
  if (aPriority !== bPriority) return aPriority - bPriority;

  const aDate = a.intervention?.reported_date ?? a.reportedDate ?? a.created_at ?? null;
  const bDate = b.intervention?.reported_date ?? b.reportedDate ?? b.created_at ?? null;
  return new Date(aDate) - new Date(bDate);
}

// Enrichit une intervention (pour le fallback orphelines)
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

// ── Classification des DI en sections ─────────────────────────────────────

function buildDISections(requests) {
  const statuts = ['nouvelle', 'en_attente', 'acceptee'];
  const sections = [];

  const sectionMeta = {
    nouvelle:   { id: 'di_nouvelle',   label: 'Demandes nouvelles',   type: 'request' },
    en_attente: { id: 'di_en_attente', label: 'Demandes en attente',  type: 'request' },
    acceptee:   { id: 'di_acceptee',   label: 'Demandes acceptées — en cours', type: 'request_accepted' },
  };

  for (const statut of statuts) {
    const items = requests
      .filter((r) => r.statut === statut)
      .map((r) => ({ ...r, daysWaiting: getDaysOpen(r.created_at) }))
      .sort(sortTileItems);

    if (items.length > 0) {
      sections.push({ ...sectionMeta[statut], items });
    }
  }

  return sections;
}

// ── Classification des interventions orphelines (fallback) ─────────────────

function classifyOrphanSections(enriched) {
  const nowItems = [];
  const waitingItems = [];
  const runningItems = [];
  const nowSet = new Set();
  const waitingSet = new Set();

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

  nowItems.sort(sortTileItems);

  enriched.forEach((s) => {
    if (nowSet.has(s.id)) return;
    const pc = s.stats?.purchasePending ?? s.stats?.purchaseCount ?? 0;
    if (pc > 0) {
      waitingItems.push({ ...s, situationType: 'blocked_piece' });
      waitingSet.add(s.id);
    }
  });

  waitingItems.sort(sortTileItems);

  enriched.forEach((s) => {
    if (nowSet.has(s.id) || waitingSet.has(s.id)) return;
    const ac = s.stats?.actionCount ?? 0;
    const pc = s.stats?.purchaseCount ?? 0;
    const hasInProgressTask = s.tasksLinked.some((t) => t.status === 'in_progress');
    if ((ac > 0 && pc === 0) || hasInProgressTask) {
      runningItems.push({ ...s, situationType: 'in_progress' });
    }
  });

  runningItems.sort(sortTileItems);

  const classifiedIds = new Set([...nowSet, ...waitingSet, ...runningItems.map((i) => i.id)]);
  const uncategorized = enriched
    .filter((s) => !classifiedIds.has(s.id))
    .sort(sortTileItems)
    .map((s) => ({ ...s, situationType: 'in_progress' }));

  const sections = [];
  if (nowItems.length > 0)      sections.push({ id: 'now',     label: 'À traiter maintenant',      type: 'situation', items: nowItems });
  if (waitingItems.length > 0)  sections.push({ id: 'waiting', label: 'Attente pièces — surveiller', type: 'situation', items: waitingItems });
  if (runningItems.length > 0)  sections.push({ id: 'running', label: 'En cours — nominal',          type: 'situation', items: runningItems });
  if (uncategorized.length > 0) sections.push({ id: 'open',    label: 'Ouvertes',                   type: 'situation', items: uncategorized });

  return sections;
}

// ── Sections pour vue équipement (inchangée) ───────────────────────────────

function classifySections(enriched, { includeAll = false } = {}) {
  const nowItems = [];
  const waitingItems = [];
  const runningItems = [];
  const nowSet = new Set();
  const waitingSet = new Set();

  enriched.forEach((s) => {
    const ac = s.stats?.actionCount ?? 0;
    const pc = s.stats?.purchaseCount ?? 0;
    const isUrgent = s.priority === 'urgent';
    const isCritical = s.machine?.health?.level === 'critical';

    let situationType = null;
    if (isUrgent && ac === 0) situationType = 'decision';
    else if (isUrgent && pc > 0) situationType = 'blocked_piece';
    else if (isCritical && ac === 0) situationType = 'decision';

    if (situationType) {
      nowItems.push({ ...s, situationType });
      nowSet.add(s.id);
    }
  });

  nowItems.sort((a, b) => {
    if (a.situationType !== b.situationType) return a.situationType === 'decision' ? -1 : 1;
    const aHasDue = a.next_due_date != null;
    const bHasDue = b.next_due_date != null;
    if (aHasDue && bHasDue) return new Date(a.next_due_date) - new Date(b.next_due_date);
    if (aHasDue) return -1;
    if (bHasDue) return 1;
    return new Date(a.reportedDate) - new Date(b.reportedDate);
  });

  enriched.forEach((s) => {
    if (nowSet.has(s.id)) return;
    const pc = s.stats?.purchasePending ?? s.stats?.purchaseCount ?? 0;
    if (pc > 0) {
      waitingItems.push({ ...s, situationType: 'blocked_piece' });
      waitingSet.add(s.id);
    }
  });

  waitingItems.sort((a, b) => b.daysOpen - a.daysOpen);

  enriched.forEach((s) => {
    if (nowSet.has(s.id) || waitingSet.has(s.id)) return;
    const ac = s.stats?.actionCount ?? 0;
    const pc = s.stats?.purchaseCount ?? 0;
    const hasInProgressTask = s.tasksLinked.some((t) => t.status === 'in_progress');
    if ((ac > 0 && pc === 0) || hasInProgressTask) {
      runningItems.push({ ...s, situationType: 'in_progress' });
    }
  });

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
    const classifiedIds = new Set([...nowSet, ...waitingSet, ...runningItems.map((i) => i.id)]);
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

function computeCounters(interventions, requests) {
  const activeRequests = requests.filter(
    (r) => r.statut === 'nouvelle' || r.statut === 'en_attente' || r.statut === 'acceptee'
  );
  return {
    requests_new:      requests.filter((r) => r.statut === 'nouvelle').length,
    requests_waiting:  requests.filter((r) => r.statut === 'en_attente').length,
    requests_accepted: requests.filter((r) => r.statut === 'acceptee').length,
    requests:          activeRequests.length,
    critical:     interventions.filter((iv) => iv.machine?.health?.level === 'critical').length,
    blocked_piece: interventions.filter((iv) => (iv.stats?.purchasePending ?? iv.stats?.purchaseCount ?? 0) > 0).length,
    decision:     interventions.filter((iv) => iv.priority === 'urgent' && (iv.stats?.actionCount ?? 0) === 0).length,
    in_progress:  interventions.reduce((sum, iv) => sum + (iv.stats?.taskProgress?.in_progress ?? 0), 0),
    preventive:   interventions.reduce((sum, iv) => sum + (iv.stats?.taskProgress?.todo ?? 0), 0),
  };
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useBriefingData({ equipementId } = {}) {
  const [sections, setSections] = useState([]);
  const [counters, setCounters] = useState({
    requests: 0, requests_new: 0, requests_waiting: 0, requests_accepted: 0,
    critical: 0, blocked_piece: 0, decision: 0, in_progress: 0, preventive: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    if (equipementId) {
      // ── Mode équipement : vue inchangée ───────────────────────────────
      const interventionParams = {
        include: 'stats,tasks',
        sort: '-priority,-reported_date',
        limit: 500,
        equipementId,
      };

      const result = await Promise.allSettled([fetchInterventions(interventionParams)]);
      const [interventionsResult] = result;

      if (interventionsResult.status === 'rejected') {
        setError(extractApiErrorMessage(interventionsResult.reason, 'Erreur lors du chargement des données'));
        setLoading(false);
        return;
      }

      const interventions = interventionsResult.value;
      const enriched = interventions.map(enrichSituation);
      const openEnriched = enriched.filter((iv) => iv.status !== 'ferme' && iv.status !== 'cancelled');
      const classifiedSections = classifySections(openEnriched, { includeAll: true });
      const archived = enriched
        .filter((iv) => iv.status === 'ferme' || iv.status === 'cancelled')
        .sort((a, b) => new Date(b.reportedDate) - new Date(a.reportedDate));

      setSections([
        ...classifiedSections,
        { id: 'archived', label: 'Archives', type: 'situation', items: archived },
      ]);
      setCounters(computeCounters(interventions, []));
      setLoading(false);
      return;
    }

    // ── Mode briefing global : piloté par les DI ──────────────────────
    const [requestsResult, interventionsResult] = await Promise.allSettled([
      fetchInterventionRequests({ excludeStatuses: 'rejetee,cloturee', limit: 200 }),
      fetchInterventions({
        include: 'stats,tasks',
        sort: '-priority,-reported_date',
        status: 'ouvert,en_cours',
        limit: 200,
      }),
    ]);

    if (requestsResult.status === 'rejected' && interventionsResult.status === 'rejected') {
      setError(extractApiErrorMessage(requestsResult.reason, 'Erreur lors du chargement des données'));
      setLoading(false);
      return;
    }

    const requests = requestsResult.status === 'fulfilled'
      ? (requestsResult.value.items ?? [])
      : [];
    const interventions = interventionsResult.status === 'fulfilled'
      ? interventionsResult.value
      : [];

    // IDs d'interventions déjà couvertes par une DI acceptée
    const coveredInterventionIds = new Set(
      requests
        .filter((r) => r.statut === 'acceptee' && r.intervention_id)
        .map((r) => r.intervention_id)
    );

    // Interventions orphelines = ouvertes sans DI liée
    const orphanInterventions = interventions.filter((iv) => !coveredInterventionIds.has(iv.id));
    const enrichedOrphans = orphanInterventions.map(enrichSituation);

    const diSections = buildDISections(requests);
    const orphanSections = classifyOrphanSections(enrichedOrphans);

    // Séparateur visuel uniquement si les deux groupes sont présents
    const newSections = [...diSections];
    if (orphanSections.length > 0) {
      newSections.push({
        id: 'separator_orphans',
        label: 'Interventions sans demande',
        type: 'separator',
        items: [],
      });
      newSections.push(...orphanSections);
    }

    setSections(newSections);
    setCounters(computeCounters(interventions, requests));
    setLoading(false);
  }, [equipementId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { sections, counters, loading, error, retry: fetchData };
}
