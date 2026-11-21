import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMonths, resolveTab, periodStart, toDateString } from './bilanParams.js';

test('période : valeur de la liste gardée, le reste retombe sur 3 mois', () => {
  assert.equal(parseMonths('6'), 6);
  assert.equal(parseMonths('24'), 24);
  assert.equal(parseMonths(null), 3);
  assert.equal(parseMonths('5'), 3);
  assert.equal(parseMonths('abc'), 3);
});

test('onglet : inconnu ou sans droit, retombe sur service', () => {
  assert.equal(resolveTab('audit', true), 'audit');
  assert.equal(resolveTab('audit', false), 'service');
  assert.equal(resolveTab('qualite', true), 'qualite');
  assert.equal(resolveTab('qualite', false), 'qualite');
  assert.equal(resolveTab('service', true), 'service');
  assert.equal(resolveTab('autre', true), 'service');
  assert.equal(resolveTab(null, true), 'service');
});

test('début de période : 1er du mois, mois courant inclus', () => {
  const now = new Date(2026, 10, 21);
  assert.equal(periodStart(3, now), '2026-09-01');
  assert.equal(periodStart(1, now), '2026-11-01');
});

test('début de période : passage d\'année', () => {
  const now = new Date(2026, 1, 10);
  assert.equal(periodStart(6, now), '2025-09-01');
  assert.equal(periodStart(24, now), '2024-03-01');
});

test('date locale AAAA-MM-JJ', () => {
  assert.equal(toDateString(new Date(2026, 0, 5, 23, 59)), '2026-01-05');
});
