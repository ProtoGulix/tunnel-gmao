import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatPct, formatNumber, formatDays, formatHours, shareOf, generationStatus,
} from './organisationFormat.js';

test('part null : tiret, jamais 0 %', () => {
  assert.equal(formatPct(null), '—');
  assert.equal(formatPct(undefined), '—');
  assert.equal(formatPct(0), '0 %');
  assert.equal(formatPct(8.3), '8,3 %');
  assert.equal(formatPct(40), '40 %');
});

test('nombre et heures', () => {
  assert.equal(formatNumber(null), '—');
  assert.equal(formatNumber(1.4), '1,4');
  assert.equal(formatHours(99.75), '99,8 h');
  assert.equal(formatHours(null), '0 h');
});

test('âge en jours : singulier, pluriel, null', () => {
  assert.equal(formatDays(null), '—');
  assert.equal(formatDays(1), '1 jour');
  assert.equal(formatDays(0), '0 jour');
  assert.equal(formatDays(12), '12 jours');
  assert.equal(formatDays(9.5), '9,5 jours');
});

test('part d\'un total : 1 décimale, null sans total', () => {
  assert.equal(shareOf(10, 99.75), 10);
  assert.equal(shareOf(1, 3), 33.3);
  assert.equal(shareOf(0, 10), 0);
  assert.equal(shareOf(5, 0), null);
});

test('génération du préventif : alerte au-delà de 35 jours ou si jamais généré', () => {
  const now = new Date('2026-06-10T12:00:00Z');
  assert.deepEqual(generationStatus('2026-06-05T08:00:00Z', now), { days: 5, alert: false });
  assert.deepEqual(generationStatus('2026-05-06T12:00:00Z', now), { days: 35, alert: false });
  assert.deepEqual(generationStatus('2026-05-05T12:00:00Z', now), { days: 36, alert: true });
  assert.deepEqual(generationStatus(null, now), { days: null, alert: true });
  assert.deepEqual(generationStatus('pas une date', now), { days: null, alert: true });
});
