/**
 * @fileoverview Règles pures de la file « à traiter » de l'accueil direction.
 * Le backend reste juge des transitions : on ne fait que lire `allowed_transitions`.
 * @module hooks/home/requestQueue
 */

const DAY_MS = 86400000;

/** Statuts d'une demande à qualifier */
export const TO_QUALIFY_STATUSES = ['nouvelle', 'en_attente'];

/** Âge en jours entiers depuis une date ISO (0 si absente ou future) */
export function ageInDays(iso, now = Date.now()) {
  if (!iso) return 0;
  const days = Math.floor((now - new Date(iso).getTime()) / DAY_MS);
  return Number.isFinite(days) && days > 0 ? days : 0;
}

/** Demandes à qualifier, les plus anciennes d'abord (créées sans date : en dernier) */
export function selectToQualify(items) {
  const time = (r) => (r.created_at ? new Date(r.created_at).getTime() : Infinity);
  return (items ?? [])
    .filter((r) => TO_QUALIFY_STATUSES.includes(r.statut))
    .sort((a, b) => time(a) - time(b));
}

/** Accepter n'est proposé que si le backend le permet ; Rejeter reste celui du panneau de demande */
export function canAcceptRequest(request) {
  return (request?.allowed_transitions ?? []).includes('acceptee');
}

/** Statuts d'une intervention non fermée */
export const OPEN_INTERVENTION_STATUSES = ['ouvert', 'attente_pieces', 'attente_prod'];
/** Statuts d'attente */
export const WAITING_STATUSES = ['attente_pieces', 'attente_prod'];

/**
 * Retire d'une liste les interventions déjà présentes dans `seen` (ensemble d'ids), et les y ajoute.
 * Une intervention n'apparaît ainsi qu'une fois dans la file, dans la première section qui la liste.
 */
export function dedupeInterventions(items, seen) {
  const kept = [];
  for (const item of items ?? []) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    kept.push(item);
  }
  return kept;
}

/** Interventions sans action, les plus longtemps inactives d'abord */
export function sortByIdleDays(items) {
  return [...(items ?? [])].sort((a, b) => (b.daysWithoutAction ?? 0) - (a.daysWithoutAction ?? 0));
}

/**
 * Action d'une échéance préventive : ouvrir l'intervention, à défaut la demande, déjà liées ;
 * sinon la lancer (si le droit l'autorise), sinon rien.
 * @returns {{ type: 'intervention'|'request'|'launch'|'none', id?: string }}
 */
export function preventiveAction(row, canAnticipate) {
  if (row?.intervention_id) return { type: 'intervention', id: row.intervention_id };
  if (row?.di_id) return { type: 'request', id: row.di_id };
  return { type: canAnticipate ? 'launch' : 'none' };
}

/**
 * Sections de la file, dans l'ordre d'affichage ; une section vide est écartée.
 * Une section : { id, kind, title, items }. Les interventions ne sont listées qu'une fois.
 * @param {{ requests?, urgent?, waiting?, idle?, preventive? }} data
 */
export function buildQueueSections({ requests, urgent, waiting, idle, preventive } = {}) {
  const seen = new Set();
  const toQualify = selectToQualify(requests);
  // Une échéance dont la demande est à qualifier n'est pas répétée en « Préventif »
  const qualifyIds = new Set(toQualify.map((r) => r.id));
  const dueRows = (preventive ?? []).filter((row) => !qualifyIds.has(row.di_id));
  const sections = [
    { id: 'to-qualify', kind: 'request', title: 'Demandes à qualifier', items: toQualify },
    { id: 'urgent', kind: 'intervention', title: 'Urgentes', items: dedupeInterventions(urgent, seen) },
    { id: 'waiting', kind: 'intervention', title: 'En attente', items: dedupeInterventions(waiting, seen) },
    { id: 'idle', kind: 'intervention', title: 'Sans action', items: dedupeInterventions(sortByIdleDays(idle), seen) },
    { id: 'preventive', kind: 'preventive', title: 'Préventif', items: dueRows },
  ];
  return sections.filter((s) => s.items.length > 0);
}

/** Achats non reçus qui bloquent une intervention en attente de pièces (0 sinon) */
export function blockingPurchases(intervention) {
  if (intervention?.status !== 'attente_pieces') return 0;
  return intervention.stats?.purchasePending ?? 0;
}

/** Précisions d'une ligne d'intervention : achats non reçus, jours sans action */
export function interventionNotes(intervention) {
  const pending = blockingPurchases(intervention);
  const days = intervention?.daysWithoutAction;
  return [
    pending > 0 ? `${pending} achat${pending > 1 ? 's' : ''} non reçu${pending > 1 ? 's' : ''}` : null,
    days != null ? `${days} j sans action` : null,
  ].filter(Boolean);
}

/** Clé de sélection d'une ligne : `request:<id>`, `intervention:<id>` ou `preventive:<plan>:<machine>` */
export function rowKey(kind, row) {
  if (kind === 'preventive') return `preventive:${row.plan_id}:${row.machine_id}`;
  return `${kind}:${row.id}`;
}

/** Genre et identifiant d'une clé de sélection ; null si la clé est inconnue ou vide */
const ID_ONLY = /^[\w-]+$/;
const ID_PAIR = /^[\w-]+:[\w-]+$/;

export function parseRowKey(key) {
  const at = typeof key === 'string' ? key.indexOf(':') : -1;
  if (at < 1) return null;
  const kind = key.slice(0, at);
  const id = key.slice(at + 1);
  // La clé vient de l'adresse : l'id finit dans une URL d'API, seuls lettres, chiffres, _ et -
  const pattern = kind === 'preventive' ? ID_PAIR : ID_ONLY;
  if (!['request', 'intervention', 'preventive'].includes(kind) || !pattern.test(id)) return null;
  return { kind, id };
}

/** Lignes de la file dans l'ordre affiché : { key, kind, row } */
export function flattenQueue(sections) {
  return (sections ?? []).flatMap((s) => s.items.map((row) => ({ key: rowKey(s.kind, row), kind: s.kind, row })));
}

/**
 * Sélection après rechargement de la file. Une ligne toujours présente reste choisie ; une ligne
 * disparue (décidée) cède la place à la suivante dans l'ordre affiché, sinon à la précédente,
 * sinon à rien. Une clé qui n'a jamais été dans la file (lien direct) n'est pas touchée.
 */
export function nextSelection(oldKeys, newKeys, selected) {
  if (!selected || newKeys.includes(selected)) return selected;
  const at = oldKeys.indexOf(selected);
  if (at < 0) return selected;
  const alive = new Set(newKeys);
  const after = oldKeys.slice(at + 1).find((k) => alive.has(k));
  if (after) return after;
  const before = oldKeys.slice(0, at).reverse().find((k) => alive.has(k));
  return before ?? null;
}
