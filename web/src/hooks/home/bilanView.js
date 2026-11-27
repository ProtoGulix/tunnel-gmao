/**
 * @fileoverview Sections affichées sous le bilan et libellé du filtre actif (règles pures).
 * @module hooks/home/bilanView
 */

import { SECTION_TITLES, selectToQualify } from './requestQueue.js';
import { filterByBucket, findBucket } from './bilanFilter.js';

/**
 * Sections de la liste pour un filtre ; aucune sans filtre.
 * @param {Object} data - { sections (file complète), requests (site général), scoped (site ou équipement du filtre) }
 */
export function sectionsForFilter(filter, { sections, requests, scoped }, stats, now = Date.now()) {
  if (!filter) return [];
  if (filter.kind === 'tile') return sections.filter((s) => s.id === filter.value);
  let items = requests;
  if (filter.kind === 'age') items = filterByBucket(requests, findBucket(stats?.age_buckets, filter.value), now);
  else if (filter.kind === 'site' || filter.kind === 'equipment') items = scoped;
  const list = selectToQualify(items);
  return list.length === 0 ? [] : [{ id: 'to-qualify', kind: 'request', title: SECTION_TITLES['to-qualify'], items: list }];
}

/** Nombre de lignes d'une liste du bloc « Où » avant « Voir tout » */
export const PLACE_LIMIT = 5;

/** « code – nom » ; l'un des deux seul s'il manque l'autre, les valeurs de l'API telles quelles */
export function placeLabel({ code, name }) {
  const c = code == null ? '' : String(code);
  const n = name == null ? '' : String(name);
  return c && n ? `${c} – ${n}` : n || c;
}

/** Liste tronquée à PLACE_LIMIT, sauf si dépliée */
export function limitItems(items, expanded) {
  const list = items ?? [];
  return expanded ? list : list.slice(0, PLACE_LIMIT);
}

/** Le bilan se replie en une ligne de rappel dès qu'un filtre est actif */
export function isCollapsed(filter) {
  return filter != null;
}

/** Code de la tranche la plus ancienne (dernière de l'API), mise en alerte si elle n'est pas vide */
export function oldestBucketCode(buckets) {
  const oldest = buckets?.length ? buckets[buckets.length - 1] : undefined;
  // Pas d'alerte sur une tranche vide
  return oldest?.count > 0 ? oldest.code : undefined;
}

// Libellé par genre de filtre ; un élément absent de la réponse (hors des dix premiers) garde un mot générique
const LABELS = {
  stock: () => 'Stock',
  age: (f, stats) => findBucket(stats?.age_buckets, f.value)?.label ?? 'Âge',
  site: (f, stats) => { const s = stats?.sites?.find((x) => x.id === f.value); return s ? placeLabel(s) : 'Site'; },
  equipment: (f, stats) => { const e = stats?.equipments?.find((x) => x.id === f.value); return e ? placeLabel(e) : 'Équipement'; },
  tile: (f) => SECTION_TITLES[f.value] ?? '',
};

/** Texte du filtre actif, depuis les libellés de l'API */
export function filterLabel(filter, stats) {
  return filter ? LABELS[filter.kind](filter, stats) : '';
}
