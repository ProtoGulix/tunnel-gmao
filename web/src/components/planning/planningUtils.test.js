import test from 'node:test';
import assert from 'node:assert/strict';
import { formatDateRangeLabel, formatWeekLabel } from './planningUtils.js';

test('plage de dates : année une seule fois dans la même année', () => {
  assert.equal(formatDateRangeLabel('2026-09-01', '2026-11-21'), '1 septembre – 21 novembre 2026');
});

test('plage de dates : année aux deux bouts si elle change', () => {
  assert.equal(formatDateRangeLabel('2025-12-01', '2026-11-21'), '1 décembre 2025 – 21 novembre 2026');
});

test('semaine : du lundi au dimanche', () => {
  assert.equal(formatWeekLabel('2026-11-16'), '16 novembre – 22 novembre 2026');
});
