/**
 * @fileoverview Règles pures du bilan de l'accueil direction : filtre actif (dans l'adresse),
 * portée de la liste des demandes, tranche d'âge. Les seuils de tranches viennent de l'API.
 * @module hooks/home/bilanFilter
 */

import { ageInDays } from './requestQueue.js';

/** Tuiles : identifiant = id de section de la file (voir buildQueueSections) */
export const TILE_IDS = ['urgent', 'waiting', 'idle', 'preventive'];

const ID = /^[\w-]+$/;
const KINDS = ['stock', 'age', 'site', 'equipment', 'tile'];

/** Filtre depuis l'adresse (`stock`, `age:<tranche>`, `site:<id>`, `equipment:<id>`, `tile:<id>`) ; null si invalide */
export function parseFilter(text) {
  if (typeof text !== 'string') return null;
  const at = text.indexOf(':');
  const kind = at < 0 ? text : text.slice(0, at);
  const value = at < 0 ? '' : text.slice(at + 1);
  if (!KINDS.includes(kind)) return null;
  if (kind === 'stock') return value === '' ? { kind } : null;
  if (!ID.test(value)) return null;
  if (kind === 'tile' && !TILE_IDS.includes(value)) return null;
  return { kind, value };
}

export function formatFilter(filter) {
  if (!filter) return '';
  return filter.value ? `${filter.kind}:${filter.value}` : filter.kind;
}

/**
 * Portée de la liste des demandes. Les comptes de l'API sont par site (descendants compris)
 * ou par équipement exact : la liste reprend la même portée, sans recalcul.
 * @returns {{machineId: string|undefined, includeDescendants: boolean|undefined}}
 */
export function requestScope(filter, siteId) {
  if (filter?.kind === 'site') return { machineId: filter.value, includeDescendants: true };
  if (filter?.kind === 'equipment') return { machineId: filter.value, includeDescendants: false };
  return { machineId: siteId || undefined, includeDescendants: siteId ? true : undefined };
}

/** Le filtre demande une liste de demandes propre à sa portée (site ou équipement) */
export function hasOwnScope(filter) {
  return filter?.kind === 'site' || filter?.kind === 'equipment';
}

/** Tranche d'âge de l'API : from_days incluse, to_days exclue (null : sans limite) */
export function inBucket(request, bucket, now = Date.now()) {
  const days = ageInDays(request?.created_at, now);
  return days >= bucket.from_days && (bucket.to_days == null || days < bucket.to_days);
}

/** Demandes d'une tranche ; tranche inconnue (API pas encore chargée) : aucune */
export function filterByBucket(requests, bucket, now = Date.now()) {
  if (!bucket) return [];
  return (requests ?? []).filter((r) => inBucket(r, bucket, now));
}

/** Tranche de l'API par son code */
export function findBucket(buckets, code) {
  return (buckets ?? []).find((b) => b.code === code) ?? null;
}

/** Une valeur de la série par semaine, dans l'ordre de l'API */
export function flowSeries(flow, key) {
  return (flow ?? []).map((w) => w[key]);
}

/** Somme d'une colonne du flux */
export function flowTotal(flow, ...keys) {
  return (flow ?? []).reduce((sum, w) => sum + keys.reduce((s, k) => s + (w[k] ?? 0), 0), 0);
}

/** Comptes des tuiles : nombre de lignes de chaque section de la file (après dédoublonnage) */
export function tileCounts(sections) {
  const counts = Object.fromEntries(TILE_IDS.map((id) => [id, 0]));
  for (const s of sections ?? []) if (s.id in counts) counts[s.id] = s.items.length;
  return counts;
}
