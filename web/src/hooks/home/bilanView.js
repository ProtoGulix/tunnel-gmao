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

const nameOf = (x) => x.name || x.code;

// Libellé par genre de filtre ; un élément absent de la réponse (hors des dix premiers) garde un mot générique
const LABELS = {
  stock: () => 'Stock',
  age: (f, stats) => findBucket(stats?.age_buckets, f.value)?.label ?? 'Âge',
  site: (f, stats) => { const s = stats?.sites?.find((x) => x.id === f.value); return s ? nameOf(s) : 'Site'; },
  equipment: (f, stats) => { const e = stats?.equipments?.find((x) => x.id === f.value); return e ? nameOf(e) : 'Équipement'; },
  tile: (f) => SECTION_TITLES[f.value] ?? '',
};

/** Texte du filtre actif, depuis les libellés de l'API */
export function filterLabel(filter, stats) {
  return filter ? LABELS[filter.kind](filter, stats) : '';
}
