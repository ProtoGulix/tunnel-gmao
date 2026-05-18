import { TYPE_INTER_LABELS, INTERVENTION_TYPES } from '@/config/interventionTypes';
import { getInterventionUrgency } from '@/hooks/useInterventionUrgency';

export const TYPE_COLOR = Object.fromEntries(INTERVENTION_TYPES.map((t) => [t.id, t.color]));

export const SECTION_BAR_COLOR = {
  now:           'var(--red-9)',
  waiting:       'var(--orange-9)',
  running:       'var(--blue-9)',
  open:          'var(--gray-7)',
  archived:      'var(--gray-5)',
  di_nouvelle:   'var(--gray-8)',
  di_en_attente: 'var(--amber-9)',
  di_acceptee:   'var(--blue-9)',
};

const DI_SECTION_IDS = new Set(['di_nouvelle', 'di_en_attente', 'di_acceptee']);

function typeFields(code) {
  return {
    typeCode:  code ?? null,
    typeLabel: code ? (TYPE_INTER_LABELS[code] ?? code) : null,
    typeColor: code ? (TYPE_COLOR[code] ?? 'gray') : 'gray',
  };
}

function diSituationType(iv) {
  if (!iv) return 'no_intervention';
  if ((iv.stats?.action_count ?? 0) === 0) return 'no_action';
  return null;
}

function orphanSituationType(rawType, actionCount, totalTasks) {
  if (rawType === 'decision')     return 'decision';
  if (rawType === 'blocked_piece') return 'blocked_piece';
  if (actionCount === 0)          return 'no_action';
  if (totalTasks === 0)           return 'no_task';
  return null;
}

function normalizeRequest(item) {
  const iv         = item.intervention ?? null;
  const nextDueDate = iv?.next_due_date ?? null;

  return {
    machineCode:   item.equipement?.code ?? null,
    urgency:       getInterventionUrgency(nextDueDate, item.created_at),
    diCode:        item.code,
    diStatutLabel: item.statut_label,
    diStatutColor: item.statut_color,
    ...typeFields(iv?.type_inter ?? null),
    situationType: diSituationType(iv),
    title:         item.description,
    techInitials:  iv?.tech_initials ?? null,
    nextDueDate,
    reportedDate:  iv?.reported_date ?? item.created_at ?? null,
    completionPct: null,
    stats:         iv?.stats ?? null,
  };
}

function normalizeOrphan(item) {
  const tasks        = item.stats?.tasks;
  const actionCount  = item.stats?.actionCount ?? 0;
  const totalTasks   = tasks?.total ?? (item.tasksLinked?.length ?? 0);
  const completionPct = tasks && (tasks.total ?? 0) > 0
    ? Math.round(((tasks.done ?? 0) / tasks.total) * 100)
    : null;

  return {
    machineCode:   item.machine?.code ?? item.code ?? null,
    urgency:       item.urgency ?? getInterventionUrgency(item.next_due_date, item.reportedDate),
    diCode:        null,
    diStatutLabel: null,
    diStatutColor: null,
    ...typeFields(item.type ?? null),
    situationType: orphanSituationType(item.situationType ?? null, actionCount, totalTasks),
    title:         item.title,
    techInitials:  item.techInitials ?? null,
    nextDueDate:   item.next_due_date ?? null,
    reportedDate:  item.reportedDate ?? null,
    completionPct,
    stats:         item.stats ?? null,
  };
}

export function normalizeTileData(item, sectionId) {
  return DI_SECTION_IDS.has(sectionId)
    ? normalizeRequest(item)
    : normalizeOrphan(item);
}
