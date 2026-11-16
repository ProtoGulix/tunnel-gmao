import test from 'node:test';
import assert from 'node:assert/strict';
import { formatMonthShort, formatMonthLong, formatShare } from './dashboardFormat.js';

test('mois court en fr-FR, sans décalage de fuseau', () => {
  assert.equal(formatMonthShort('2026-04'), 'avr. 26');
  assert.equal(formatMonthShort('2026-01'), 'janv. 26');
  assert.equal(formatMonthShort('2026-12'), 'déc. 26');
  assert.equal(formatMonthShort(''), '');
});

test('mois long en fr-FR', () => {
  assert.equal(formatMonthLong('2026-03'), 'mars 2026');
  assert.equal(formatMonthLong(undefined), '');
});

test('part en % : entier arrondi, seuil sous 1 %, total nul', () => {
  assert.equal(formatShare(1, 4), '25 %');
  assert.equal(formatShare(2, 3), '67 %');
  assert.equal(formatShare(1, 1000), '< 1 %');
  assert.equal(formatShare(0, 10), '0 %');
  assert.equal(formatShare(5, 0), '—');
});
