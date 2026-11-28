import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ageInDays, canTransition, groupToDecide, visibleOld, OLD_LIMIT, purchaseCauses, productionCause,
  thresholdLabel, emptyBlockLabel, trendSentence, flowTotal, flowSeries, placeLabel, oldestBucket,
} from './decisionQueue.js';

const NOW = new Date('2026-11-27T12:00:00Z').getTime();
const BUCKETS = [
  { code: 'lt_7', label: 'Moins de 7 jours', from_days: 0, to_days: 7 },
  { code: 'gt_90', label: 'Plus de 90 jours', from_days: 90, to_days: null },
];
const req = (id, extra) => ({ id, statut: 'nouvelle', created_at: '2026-11-20T00:00:00Z', ...extra });

test('âge en jours : entier, 0 sans date ou date future', () => {
  assert.equal(ageInDays('2026-11-24T12:00:00Z', NOW), 3);
  assert.equal(ageInDays('2026-11-27T11:00:00Z', NOW), 0);
  assert.equal(ageInDays('2026-12-01T00:00:00Z', NOW), 0);
  assert.equal(ageInDays(null, NOW), 0);
});

test('transition : seulement si l\'API la permet', () => {
  assert.equal(canTransition({ allowed_transitions: ['acceptee', 'rejetee'] }, 'acceptee'), true);
  assert.equal(canTransition({ allowed_transitions: ['rejetee'] }, 'en_attente'), false);
  assert.equal(canTransition({}, 'acceptee'), false);
});

test('regroupement : urgentes, tranche la plus ancienne de l\'API, autres, ordre de l\'API conservé', () => {
  const list = [
    req('a', { priorite: 'urgent', created_at: '2026-01-01T00:00:00Z' }),
    req('b', { created_at: '2026-01-01T00:00:00Z' }),
    req('c'),
    req('d', { statut: 'en_attente', created_at: '2026-11-10T00:00:00Z' }),
    req('x', { statut: 'acceptee' }),
  ];
  const g = groupToDecide(list, BUCKETS, NOW);
  assert.deepEqual(g.urgent.map((r) => r.id), ['a']);
  assert.deepEqual(g.old.map((r) => r.id), ['b']);
  assert.deepEqual(g.rest.map((r) => r.id), ['c', 'd']);
  assert.equal(g.oldTitle, 'Plus de 90 jours');
});

test('regroupement : borne de l\'API incluse, pas de 90 codé en dur', () => {
  const buckets = [{ code: 'gt_30', label: 'Plus de 30 jours', from_days: 30, to_days: null }];
  const g = groupToDecide([req('a', { created_at: '2026-10-28T12:00:00Z' }), req('b')], buckets, NOW);
  assert.deepEqual(g.old.map((r) => r.id), ['a']);
  assert.deepEqual(groupToDecide([req('a')], undefined, NOW).old, []);
});

test('tranche la plus ancienne : la dernière de l\'API', () => {
  assert.equal(oldestBucket(BUCKETS).code, 'gt_90');
  assert.equal(oldestBucket([]), null);
});

test('anciennes : tronquées à la limite, toutes une fois dépliées', () => {
  const old = Array.from({ length: OLD_LIMIT + 3 }, (_, i) => req(String(i)));
  assert.equal(visibleOld(old, false).length, OLD_LIMIT);
  assert.equal(visibleOld(old, true).length, OLD_LIMIT + 3);
});

test('causes d\'achat : un compteur par statut qui bloque, accord au pluriel, reçues écartées', () => {
  assert.deepEqual(
    purchaseCauses({ total: 5, received: 1, to_qualify: 2, no_supplier_ref: 1, quoted: 1 }),
    ['2 DA à qualifier', '1 DA sans réf. fournisseur', '1 DA chiffrée, pas commandée'],
  );
  assert.deepEqual(purchaseCauses({ total: 2, ordered: 2 }), ['2 DA commandées']);
  assert.deepEqual(purchaseCauses({ total: 0 }), ['Aucune demande d’achat']);
  assert.deepEqual(purchaseCauses(undefined), ['Aucune demande d’achat']);
});

test('cause de production : note entre guillemets, sinon aucun motif', () => {
  assert.equal(productionCause('Arrêt à caler'), '« Arrêt à caler »');
  assert.equal(productionCause(null), 'Aucun motif saisi');
  assert.equal(productionCause('   '), 'Aucun motif saisi');
});

test('seuil de blocage lu dans la réponse', () => {
  assert.equal(thresholdLabel(7), 'Bloquées depuis 7 jours ou plus');
  assert.equal(thresholdLabel(1), 'Bloquées depuis 1 jour ou plus');
  assert.equal(emptyBlockLabel('parts', 7), 'Aucune intervention attend une pièce depuis 7 jours ou plus.');
  assert.equal(emptyBlockLabel('production', 1), 'Aucune intervention attend la production depuis 1 jour ou plus.');
});

test('phrase de tendance : selon le sens de l\'API, rien sans sens', () => {
  assert.equal(trendSentence('up'), 'Le stock augmente');
  assert.equal(trendSentence('down'), 'Le stock baisse');
  assert.equal(trendSentence('stable'), 'Stock stable');
  assert.equal(trendSentence(null), null);
});

test('flux : séries et totaux', () => {
  const flow = [{ created: 3, accepted: 1, rejected: 1, stock_end: 10 }, { created: 2, accepted: 2, stock_end: 8 }];
  assert.deepEqual(flowSeries(flow, 'stock_end'), [10, 8]);
  assert.equal(flowTotal(flow, 'created'), 5);
  assert.equal(flowTotal(flow, 'accepted', 'rejected'), 4);
  assert.equal(flowTotal(undefined, 'created'), 0);
});

test('libellé code – nom, tel que renvoyé par l\'API', () => {
  assert.equal(placeLabel({ code: 'VLT', name: 'Villettes' }), 'VLT – Villettes');
  assert.equal(placeLabel({ code: 'VLT', name: null }), 'VLT');
  assert.equal(placeLabel({ code: null, name: 'Villettes' }), 'Villettes');
});
