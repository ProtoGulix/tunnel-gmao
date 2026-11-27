import test from 'node:test';
import assert from 'node:assert/strict';
import { ageInDays, selectToQualify, canAcceptRequest, buildQueueSections,
  rowKey, parseRowKey, flattenQueue, nextSelection,
  dedupeInterventions, preventiveAction, interventionNotes, sortByIdleDays } from './requestQueue.js';

const NOW = new Date('2026-11-27T12:00:00Z').getTime();

test('âge en jours : entier, 0 sans date ou date future', () => {
  assert.equal(ageInDays('2026-11-24T12:00:00Z', NOW), 3);
  assert.equal(ageInDays('2026-11-27T11:00:00Z', NOW), 0);
  assert.equal(ageInDays('2026-12-01T00:00:00Z', NOW), 0);
  assert.equal(ageInDays(null, NOW), 0);
});

test('à qualifier : nouvelle et en attente, plus anciennes d\'abord', () => {
  const sorted = selectToQualify([
    { id: 'b', statut: 'nouvelle', created_at: '2026-11-20T00:00:00Z' },
    { id: 'x', statut: 'acceptee', created_at: '2026-01-01T00:00:00Z' },
    { id: 'a', statut: 'en_attente', created_at: '2026-11-01T00:00:00Z' },
    { id: 'n', statut: 'nouvelle', created_at: null },
  ]);
  assert.deepEqual(sorted.map((r) => r.id), ['a', 'b', 'n']);
  assert.deepEqual(selectToQualify(undefined), []);
});

test('accepter : seulement si la transition est permise', () => {
  assert.equal(canAcceptRequest({ allowed_transitions: ['acceptee', 'rejetee'] }), true);
  assert.equal(canAcceptRequest({ allowed_transitions: ['rejetee'] }), false);
  assert.equal(canAcceptRequest({}), false);
});

test('sections : une section vide est masquée', () => {
  assert.deepEqual(buildQueueSections({}), []);
  assert.deepEqual(buildQueueSections({ requests: [{ id: '1', statut: 'cloturee' }] }), []);
  const sections = buildQueueSections({
    requests: [{ id: '1', statut: 'nouvelle', created_at: '2026-11-01T00:00:00Z' }],
  });
  assert.equal(sections.length, 1);
  assert.equal(sections[0].id, 'to-qualify');
});

test('dédoublonnage : une intervention reste dans la première section qui la liste', () => {
  const sections = buildQueueSections({
    urgent: [{ id: 'a' }, { id: 'b' }],
    waiting: [{ id: 'b' }, { id: 'c' }],
    idle: [{ id: 'a' }, { id: 'c' }, { id: 'd' }],
  });
  assert.deepEqual(sections.map((s) => [s.id, s.items.map((i) => i.id)]), [
    ['urgent', ['a', 'b']],
    ['waiting', ['c']],
    ['idle', ['d']],
  ]);
});

test('dédoublonnage : une section entièrement répétée disparaît', () => {
  const seen = new Set(['a']);
  assert.deepEqual(dedupeInterventions([{ id: 'a' }], seen), []);
  assert.deepEqual(dedupeInterventions(undefined, seen), []);
});

test('sections : ordre fixe, préventif en dernier', () => {
  const sections = buildQueueSections({
    preventive: [{ plan_id: 'p' }],
    idle: [{ id: 'i' }],
    waiting: [{ id: 'w' }],
    urgent: [{ id: 'u' }],
    requests: [{ id: 'r', statut: 'nouvelle' }],
  });
  assert.deepEqual(sections.map((s) => s.id), ['to-qualify', 'urgent', 'waiting', 'idle', 'preventive']);
});

test('préventif : intervention, sinon demande, sinon lancer selon le droit', () => {
  assert.deepEqual(preventiveAction({ intervention_id: 'i', di_id: 'd' }, true), { type: 'intervention', id: 'i' });
  assert.deepEqual(preventiveAction({ di_id: 'd' }, false), { type: 'request', id: 'd' });
  assert.deepEqual(preventiveAction({}, true), { type: 'launch' });
  assert.deepEqual(preventiveAction({}, false), { type: 'none' });
});

test('notes d\'une intervention : achats non reçus (attente de pièces seulement) et jours', () => {
  assert.deepEqual(
    interventionNotes({ status: 'attente_pieces', stats: { purchasePending: 2 }, daysWithoutAction: 9 }),
    ['2 achats non reçus', '9 j sans action'],
  );
  assert.deepEqual(interventionNotes({ status: 'attente_pieces', stats: { purchasePending: 1 } }), ['1 achat non reçu']);
  assert.deepEqual(interventionNotes({ status: 'attente_prod', stats: { purchasePending: 3 } }), []);
  assert.deepEqual(interventionNotes({ status: 'ouvert', daysWithoutAction: 0 }), ['0 j sans action']);
});

test('sans action : les plus longtemps inactives d\'abord', () => {
  const sorted = sortByIdleDays([{ id: 'a', daysWithoutAction: 8 }, { id: 'b', daysWithoutAction: 40 }, { id: 'c' }]);
  assert.deepEqual(sorted.map((i) => i.id), ['b', 'a', 'c']);
});

test('préventif : l\'échéance d\'une demande à qualifier n\'est pas répétée', () => {
  const sections = buildQueueSections({
    requests: [{ id: 'r', statut: 'nouvelle' }],
    preventive: [{ plan_id: 'p1', machine_id: 'm', di_id: 'r' }, { plan_id: 'p2', machine_id: 'm', di_id: 'autre' }],
  });
  assert.deepEqual(sections.find((s) => s.id === 'preventive').items.map((r) => r.plan_id), ['p2']);
  const alone = buildQueueSections({ requests: [{ id: 'r', statut: 'nouvelle' }], preventive: [{ plan_id: 'p1', di_id: 'r' }] });
  assert.deepEqual(alone.map((s) => s.id), ['to-qualify']);
});

test('clé de sélection : genre et identifiant, aller-retour', () => {
  assert.equal(rowKey('request', { id: 'r1' }), 'request:r1');
  assert.equal(rowKey('intervention', { id: 7 }), 'intervention:7');
  const key = rowKey('preventive', { plan_id: 'p', machine_id: 'm' });
  assert.equal(key, 'preventive:p:m');
  assert.deepEqual(parseRowKey(key), { kind: 'preventive', id: 'p:m' });
  assert.deepEqual(parseRowKey('request:abc'), { kind: 'request', id: 'abc' });
  assert.equal(parseRowKey('abc'), null);
  assert.equal(parseRowKey('autre:1'), null);
  assert.equal(parseRowKey('request:'), null);
  assert.equal(parseRowKey(null), null);
});

test('lignes à plat : ordre des sections, une clé par ligne', () => {
  const sections = buildQueueSections({
    requests: [{ id: 'r', statut: 'nouvelle' }],
    urgent: [{ id: 'u' }],
    preventive: [{ plan_id: 'p', machine_id: 'm' }],
  });
  assert.deepEqual(flattenQueue(sections).map((l) => l.key), ['request:r', 'intervention:u', 'preventive:p:m']);
  assert.deepEqual(flattenQueue(undefined), []);
});

test('sélection : la ligne présente reste, la disparue cède à la suivante, sinon la précédente', () => {
  const old = ['a', 'b', 'c'];
  assert.equal(nextSelection(old, ['a', 'b', 'c'], 'b'), 'b');
  assert.equal(nextSelection(old, ['a', 'c'], 'b'), 'c');
  assert.equal(nextSelection(old, ['a', 'b'], 'c'), 'b');
  assert.equal(nextSelection(old, ['a'], 'b'), 'a');
  assert.equal(nextSelection(['a'], [], 'a'), null);
  assert.equal(nextSelection(old, ['a', 'c'], null), null);
  assert.equal(nextSelection(old, ['a'], 'lien-direct'), 'lien-direct');
});

test('clé de l\'adresse : un id hors lettres, chiffres, _ et - est refusé', () => {
  assert.equal(parseRowKey('request:../machines/5'), null);
  assert.equal(parseRowKey('intervention:12?x=1'), null);
  assert.equal(parseRowKey('preventive:abc'), null);
  assert.deepEqual(parseRowKey('preventive:p-1:m_2'), { kind: 'preventive', id: 'p-1:m_2' });
  assert.deepEqual(parseRowKey('request:3f2a-9b'), { kind: 'request', id: '3f2a-9b' });
});
