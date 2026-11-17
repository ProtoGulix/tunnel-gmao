import { test } from 'node:test';
import assert from 'node:assert/strict';

import { unwrapEnvelope } from './unwrapEnvelope.js';

test('unwrapEnvelope : { data } déballé', () => {
  assert.deepEqual(unwrapEnvelope({ data: { id: 1 } }), { data: { id: 1 } });
});

test('unwrapEnvelope : { data, audit } déballé, audit conservé à part', () => {
  const audit = { rules: [] };
  assert.deepEqual(unwrapEnvelope({ data: { id: 1 }, audit }), { data: { id: 1 }, audit });
});

test('unwrapEnvelope : { items, pagination } laissé tel quel', () => {
  const body = { items: [1], pagination: { total: 1 } };
  assert.deepEqual(unwrapEnvelope(body), { data: body });
});

test('unwrapEnvelope : { data } liste déballée', () => {
  assert.deepEqual(unwrapEnvelope({ data: [1, 2] }), { data: [1, 2] });
});

test('unwrapEnvelope : liste brute laissée telle quelle', () => {
  assert.deepEqual(unwrapEnvelope([1, 2]), { data: [1, 2] });
});

test('unwrapEnvelope : objet nu laissé tel quel', () => {
  assert.deepEqual(unwrapEnvelope({ id: 1 }), { data: { id: 1 } });
});

test('unwrapEnvelope : null et corps vide laissés tels quels', () => {
  assert.deepEqual(unwrapEnvelope(null), { data: null });
  assert.deepEqual(unwrapEnvelope(''), { data: '' });
});
