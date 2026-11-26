import test from 'node:test';
import assert from 'node:assert/strict';
import { keyFigures, segmentsOf, totalOf, isEmptyInsights } from './constatInsightsFormat.js';

const DATA = {
  total: 4,
  by_month: [{ month: '2026-10', count: 0 }, { month: '2026-11', count: 4 }],
  signals: [
    { code: 'SIGNAL_SEEN', label: 'Vu', count: 1 },
    { code: 'SIGNAL_NOT_REPORTED', label: 'Non remonté', count: 1 },
    { code: 'SIGNAL_NONE', label: 'Non', count: 2 },
  ],
  outcomes: [
    { code: 'nouvelle', label: 'Nouvelle', color: '#111', count: 2 },
    { code: 'acceptee', label: 'Acceptée', color: '#222', count: 1 },
    { code: 'rattachee', label: 'Rattachée', color: '#333', count: 1 },
  ],
};

test('chiffres clés : série mensuelle, parts du signal et des suggestions retenues', () => {
  const f = keyFigures(DATA);
  assert.deepEqual(f.series, [0, 4]);
  assert.deepEqual(f.visible, { count: 2, of: 4, share: 50 });
  assert.deepEqual(f.notReported, { count: 1, of: 4, share: 25 });
  assert.deepEqual(f.retained, { count: 1, of: 4, share: 25 });
  assert.equal(f.pending, 2);
});

test('chiffres clés : sans réponse, part nulle', () => {
  const f = keyFigures({ total: 0 });
  assert.equal(f.visible.share, null);
  assert.deepEqual(f.series, []);
});

test('segments : couleur de l API, puis du type, puis du code, sinon gris', () => {
  const segs = segmentsOf([
    { code: 'nouvelle', label: 'N', color: '#111', count: 1 },
    { code: 'TASK', label: 'T', suggested_type_inter: 'PRE', count: 2 },
    { code: 'SIGNAL_SEEN', label: 'S', count: 0 },
    { code: 'OTHER', label: 'A', count: 3 },
  ], (t) => `type-${t}`);
  assert.deepEqual(segs.map((s) => s.color), ['#111', 'type-PRE', 'var(--orange-9)', 'var(--gray-8)']);
  assert.deepEqual(segs.map((s) => s.value), [1, 2, 0, 3]);
  assert.equal(totalOf(segs.map((s) => ({ count: s.value }))), 6);
});

test('état vide : total absent ou à 0', () => {
  assert.equal(isEmptyInsights(null), true);
  assert.equal(isEmptyInsights({ total: 0 }), true);
  assert.equal(isEmptyInsights({ total: 2 }), false);
});
