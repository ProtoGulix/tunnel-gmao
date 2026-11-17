import { test } from 'node:test';
import assert from 'node:assert/strict';

import { singleBody } from './singleBody.js';

test('singleBody : réponse déjà déballée par l intercepteur, rendue telle quelle', () => {
  const intervention = { id: 'abc', code: 'EER001-PRO-20261116-QC', title: 'Mise en service' };
  assert.deepEqual(singleBody(intervention), intervention);
});

test('singleBody : enveloppe { data, audit } conservée par l intercepteur, data extrait', () => {
  const intervention = { id: 'abc', title: 'Mise en service' };
  assert.deepEqual(singleBody({ data: intervention, audit: { rules: [] } }), intervention);
});

test('singleBody : corps absent, objet vide', () => {
  assert.deepEqual(singleBody(undefined), {});
});
