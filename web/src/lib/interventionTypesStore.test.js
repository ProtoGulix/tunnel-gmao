import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createTypesStore, labelOf, colorOf } from './interventionTypesStore.js';

const TYPES = [{ id: 'CUR', title: 'Curatif', color: 'red', is_active: true }];

test('chargement : types disponibles, un seul appel, abonnés notifiés', async () => {
  let calls = 0;
  const store = createTypesStore(async () => { calls += 1; return TYPES; });
  let notified = 0;
  store.subscribe(() => { notified += 1; });
  await Promise.all([store.load(), store.load()]);
  await store.load();
  assert.equal(calls, 1);
  assert.equal(notified, 1);
  assert.deepEqual(store.getSnapshot(), TYPES);
});

test('échec : liste vide, code brut affiché, nouvel essai possible', async () => {
  let calls = 0;
  const store = createTypesStore(async () => {
    calls += 1;
    if (calls === 1) throw new Error('réseau');
    return TYPES;
  });
  await store.load();
  assert.deepEqual(store.getSnapshot(), []);
  assert.equal(labelOf(store.getSnapshot(), 'CUR'), 'CUR');
  assert.equal(colorOf(store.getSnapshot(), 'CUR'), 'gray');
  await store.load();
  assert.equal(labelOf(store.getSnapshot(), 'CUR'), 'Curatif');
});

test('code inconnu ou absent : repli sans erreur', () => {
  assert.equal(labelOf(TYPES, 'ZZZ'), 'ZZZ');
  assert.equal(labelOf(TYPES, null), null);
  assert.equal(colorOf(TYPES, 'ZZZ'), 'gray');
});
