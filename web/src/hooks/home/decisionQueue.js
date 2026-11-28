/**
 * @fileoverview Règles pures de l'accueil direction « Ce qui attend votre décision » (ADR 0047) :
 * regroupement des demandes, causes d'un blocage achats, phrases du bilan. L'ordre des demandes
 * et les seuils (tranches d'âge, durée de blocage) viennent de l'API.
 * @module hooks/home/decisionQueue
 */

const DAY_MS = 86400000;

/** Statuts d'une demande à trancher */
export const TO_QUALIFY_STATUSES = ['nouvelle', 'en_attente'];

/** Demandes anciennes affichées avant « Voir les N autres » */
export const OLD_LIMIT = 5;

/** Âge en jours entiers depuis une date ISO (0 si absente ou future) */
export function ageInDays(iso, now = Date.now()) {
  if (!iso) return 0;
  const days = Math.floor((now - new Date(iso).getTime()) / DAY_MS);
  return Number.isFinite(days) && days > 0 ? days : 0;
}

/** Le backend reste juge : un bouton n'apparaît que si sa transition est permise */
export function canTransition(request, statusTo) {
  return (request?.allowed_transitions ?? []).includes(statusTo);
}

/** Tranche la plus ancienne de l'API (la dernière), ou null */
export function oldestBucket(buckets) {
  return buckets?.length ? buckets[buckets.length - 1] : null;
}

/**
 * Groupes de « À trancher », dans l'ordre de l'API : urgentes, puis tranche la plus ancienne,
 * puis les autres. Une urgente ancienne reste dans les urgentes.
 * @returns {{urgent: Array, old: Array, rest: Array, oldTitle: string}}
 */
export function groupToDecide(requests, buckets, now = Date.now()) {
  const bucket = oldestBucket(buckets);
  const groups = { urgent: [], old: [], rest: [], oldTitle: bucket ? `Plus de ${bucket.from_days} jours` : '' };
  for (const r of requests ?? []) {
    if (!TO_QUALIFY_STATUSES.includes(r.statut)) continue;
    if (r.priorite === 'urgent') groups.urgent.push(r);
    else if (bucket && ageInDays(r.created_at, now) >= bucket.from_days) groups.old.push(r);
    else groups.rest.push(r);
  }
  return groups;
}

/** Demandes anciennes visibles : tronquées à OLD_LIMIT sauf si dépliées */
export function visibleOld(old, expanded) {
  return expanded ? old : old.slice(0, OLD_LIMIT);
}

// Causes d'achat qui bloquent, par statut dérivé : [singulier, pluriel]. « reçue » ne bloque pas.
const PURCHASE_CAUSES = [
  ['to_qualify', 'à qualifier', 'à qualifier'],
  ['no_supplier_ref', 'sans réf. fournisseur', 'sans réf. fournisseur'],
  ['pending_dispatch', 'à envoyer', 'à envoyer'],
  ['rejected', 'rejetée', 'rejetées'],
  ['consultation', 'en consultation', 'en consultation'],
  ['quoted', 'chiffrée, pas commandée', 'chiffrées, pas commandées'],
  ['open', 'ouverte', 'ouvertes'],
  ['partial', 'reçue en partie', 'reçues en partie'],
  ['ordered', 'commandée', 'commandées'],
];

/** Pastilles de cause d'une intervention en attente de pièces : « 2 DA à qualifier » */
export function purchaseCauses(counts) {
  const causes = PURCHASE_CAUSES
    .filter(([key]) => (counts?.[key] ?? 0) > 0)
    .map(([key, one, many]) => `${counts[key]} DA ${counts[key] > 1 ? many : one}`);
  return causes.length > 0 ? causes : ['Aucune demande d’achat'];
}

/** Note de production entre guillemets, sinon « Aucun motif saisi » */
export function productionCause(note) {
  const text = typeof note === 'string' ? note.trim() : '';
  return text ? `« ${text} »` : 'Aucun motif saisi';
}

/** Durée de blocage : « 9 j » */
export function daysLabel(days) {
  return `${days ?? 0} j`;
}

/** Sous-titre d'une carte de blocage, seuil lu dans la réponse de l'API */
export function thresholdLabel(days) {
  return `Bloquées depuis ${days} jour${days > 1 ? 's' : ''} ou plus`;
}

/** Phrase sur une carte vide, selon l'interlocuteur ; seuil lu dans la réponse */
export function emptyBlockLabel(subject, days) {
  const who = subject === 'parts' ? 'attend une pièce' : 'attend la production';
  return `Aucune intervention ${who} depuis ${days} jour${days > 1 ? 's' : ''} ou plus.`;
}

/** Phrase de tendance du stock ; null si l'API ne donne pas de sens */
export function trendSentence(direction) {
  const sentences = { up: 'Le stock augmente', down: 'Le stock baisse', stable: 'Stock stable' };
  return sentences[direction] ?? null;
}

/** Somme d'une ou plusieurs colonnes du flux hebdomadaire */
export function flowTotal(flow, ...keys) {
  return (flow ?? []).reduce((sum, w) => sum + keys.reduce((s, k) => s + (w[k] ?? 0), 0), 0);
}

/** Une valeur de la série par semaine, dans l'ordre de l'API */
export function flowSeries(flow, key) {
  return (flow ?? []).map((w) => w[key]);
}

/** « code – nom » ; l'un des deux seul s'il manque l'autre, les valeurs de l'API telles quelles */
export function placeLabel({ code, name }) {
  const c = code == null ? '' : String(code);
  const n = name == null ? '' : String(name);
  return c && n ? `${c} – ${n}` : n || c;
}

/** « équipement » d'une ligne : « code – nom » ; vide sans équipement */
export function equipmentLabel(equipement) {
  return equipement ? placeLabel(equipement) : '';
}
