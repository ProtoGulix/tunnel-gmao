import test from 'node:test';
import assert from 'node:assert/strict';
import { parseFilter, formatFilter, requestScope, hasOwnScope, inBucket, filterByBucket, findBucket,
  flowSeries, flowTotal, tileCounts } from './bilanFilter.js';
import { sectionsForFilter, filterLabel, placeLabel, limitItems, isCollapsed, oldestBucketCode, PLACE_LIMIT } from './bilanView.js';

const NOW = new Date('2026-11-27T12:00:00Z').getTime();
const daysAgo = (n) => new Date(NOW - n * 86400000).toISOString();

test('filtre : lecture et écriture dans l\'adresse', () => {
  assert.deepEqual(parseFilter('stock'), { kind: 'stock' });
  assert.deepEqual(parseFilter('age:gt_90'), { kind: 'age', value: 'gt_90' });
  assert.deepEqual(parseFilter('site:abc-1'), { kind: 'site', value: 'abc-1' });
  assert.deepEqual(parseFilter('tile:idle'), { kind: 'tile', value: 'idle' });
  assert.equal(formatFilter(parseFilter('equipment:e1')), 'equipment:e1');
  assert.equal(formatFilter({ kind: 'stock' }), 'stock');
  assert.equal(formatFilter(null), '');
});

test('filtre : valeurs invalides refusées', () => {
  for (const bad of [null, '', 'stock:1', 'age', 'age:a/b', 'tile:autre', 'inconnu:1', 'site:a b']) {
    assert.equal(parseFilter(bad), null, String(bad));
  }
});

test('portée : site avec descendants, équipement exact, sinon site général', () => {
  assert.deepEqual(requestScope({ kind: 'site', value: 's' }, 'g'), { machineId: 's', includeDescendants: true });
  assert.deepEqual(requestScope({ kind: 'equipment', value: 'e' }, 'g'), { machineId: 'e', includeDescendants: false });
  assert.deepEqual(requestScope({ kind: 'age', value: 'lt_7' }, 'g'), { machineId: 'g', includeDescendants: true });
  assert.deepEqual(requestScope(null, ''), { machineId: undefined, includeDescendants: undefined });
  assert.equal(hasOwnScope({ kind: 'site', value: 's' }), true);
  assert.equal(hasOwnScope({ kind: 'stock' }), false);
});

test('tranche : borne basse incluse, haute exclue, sans limite', () => {
  const mid = { code: '7_30', from_days: 7, to_days: 30 };
  const old = { code: 'gt_90', from_days: 90, to_days: null };
  assert.equal(inBucket({ created_at: daysAgo(6) }, mid, NOW), false);
  assert.equal(inBucket({ created_at: daysAgo(7) }, mid, NOW), true);
  assert.equal(inBucket({ created_at: daysAgo(29) }, mid, NOW), true);
  assert.equal(inBucket({ created_at: daysAgo(30) }, mid, NOW), false);
  assert.equal(inBucket({ created_at: daysAgo(259) }, old, NOW), true);
});

test('tranche : filtrage et recherche par code', () => {
  const buckets = [{ code: 'lt_7', from_days: 0, to_days: 7 }, { code: 'gt_90', from_days: 90, to_days: null }];
  const reqs = [{ id: 'a', created_at: daysAgo(2) }, { id: 'b', created_at: daysAgo(100) }];
  assert.deepEqual(filterByBucket(reqs, findBucket(buckets, 'gt_90'), NOW).map((r) => r.id), ['b']);
  assert.deepEqual(filterByBucket(reqs, findBucket(buckets, 'x'), NOW), []);
});

test('séries du flux', () => {
  const flow = [{ created: 2, accepted: 1, rejected: 0, stock_end: 5 }, { created: 4, accepted: 1, rejected: 2, stock_end: 6 }];
  assert.deepEqual(flowSeries(flow, 'stock_end'), [5, 6]);
  assert.equal(flowTotal(flow, 'created'), 6);
  assert.equal(flowTotal(flow, 'accepted', 'rejected'), 4);
  assert.equal(flowTotal(undefined, 'created'), 0);
});

test('tuiles : une section absente compte 0', () => {
  const counts = tileCounts([{ id: 'to-qualify', items: [1, 2, 3] }, { id: 'urgent', items: [1, 2] }]);
  assert.deepEqual(counts, { urgent: 2, waiting: 0, idle: 0, preventive: 0 });
});

test('sections du filtre : aucune sans filtre, tranche, portée, tuile', () => {
  const stats = { age_buckets: [{ code: 'gt_90', label: '> 90 j', from_days: 90, to_days: null }], sites: [{ id: 's', name: 'Nord', code: 'N' }] };
  const requests = [
    { id: 'a', statut: 'nouvelle', created_at: daysAgo(2) },
    { id: 'b', statut: 'nouvelle', created_at: daysAgo(100) },
  ];
  const scoped = [{ id: 'c', statut: 'en_attente', created_at: daysAgo(5) }];
  const sections = [{ id: 'urgent', kind: 'intervention', items: [{ id: 'i' }] }];
  const data = { sections, requests, scoped };
  assert.deepEqual(sectionsForFilter(null, data, stats, NOW), []);
  assert.deepEqual(sectionsForFilter({ kind: 'stock' }, data, stats, NOW)[0].items.map((r) => r.id), ['b', 'a']);
  assert.deepEqual(sectionsForFilter({ kind: 'age', value: 'gt_90' }, data, stats, NOW)[0].items.map((r) => r.id), ['b']);
  assert.deepEqual(sectionsForFilter({ kind: 'site', value: 's' }, data, stats, NOW)[0].items.map((r) => r.id), ['c']);
  assert.deepEqual(sectionsForFilter({ kind: 'equipment', value: 'e' }, data, stats, NOW)[0].items.map((r) => r.id), ['c']);
  assert.equal(sectionsForFilter({ kind: 'tile', value: 'urgent' }, data, stats, NOW)[0].items.length, 1);
  assert.deepEqual(sectionsForFilter({ kind: 'tile', value: 'idle' }, data, stats, NOW), []);
  // Tranche absente de la réponse (lien ancien) : liste vide, jamais tout le stock
  assert.deepEqual(sectionsForFilter({ kind: 'age', value: 'inconnue' }, data, stats, NOW), []);
});

test('libellé du filtre', () => {
  const stats = { age_buckets: [{ code: 'lt_7', label: '< 7 j' }], sites: [{ id: 's', name: 'Nord' }] };
  assert.equal(filterLabel({ kind: 'age', value: 'lt_7' }, stats), '< 7 j');
  assert.equal(filterLabel({ kind: 'site', value: 's' }, stats), 'Nord');
  assert.equal(filterLabel({ kind: 'site', value: 's' }, { sites: [{ id: 's', code: 'N', name: 'Nord' }] }), 'N – Nord');
  assert.equal(filterLabel({ kind: 'equipment', value: 'x' }, stats), 'Équipement');
  assert.equal(filterLabel({ kind: 'site', value: 'absent' }, stats), 'Site');
  assert.equal(filterLabel({ kind: 'age', value: 'absente' }, stats), 'Âge');
  assert.equal(filterLabel({ kind: 'tile', value: 'idle' }, stats), 'Sans action');
  assert.equal(filterLabel(null, stats), '');
});

test('libellé code – nom, tel que renvoyé par l\'API', () => {
  assert.equal(placeLabel({ code: 'VLT', name: 'Villettes' }), 'VLT – Villettes');
  assert.equal(placeLabel({ code: null, name: 'Presse' }), 'Presse');
  assert.equal(placeLabel({ code: 'PRS', name: '' }), 'PRS');
  assert.equal(placeLabel({ code: 'PRS', name: '0' }), 'PRS – 0');
  assert.equal(placeLabel({}), '');
});

test('troncature des listes du bilan', () => {
  const list = [1, 2, 3, 4, 5, 6, 7];
  assert.equal(PLACE_LIMIT, 5);
  assert.deepEqual(limitItems(list, false), [1, 2, 3, 4, 5]);
  assert.deepEqual(limitItems(list, true), list);
  assert.deepEqual(limitItems([1, 2], false), [1, 2]);
  assert.deepEqual(limitItems(undefined, false), []);
});

test('bilan replié dès qu\'un filtre est actif', () => {
  assert.equal(isCollapsed(null), false);
  assert.equal(isCollapsed({ kind: 'stock' }), true);
});

test('tranche la plus ancienne : dernier code de l\'API', () => {
  assert.equal(oldestBucketCode([{ code: 'lt_7', count: 2 }, { code: 'gt_90', count: 50 }]), 'gt_90');
  assert.equal(oldestBucketCode([{ code: 'lt_7', count: 2 }, { code: 'gt_90', count: 0 }]), undefined);
  assert.equal(oldestBucketCode([]), undefined);
  assert.equal(oldestBucketCode(undefined), undefined);
});
