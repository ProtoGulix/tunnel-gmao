// Lancé par `npm test` (node --test, aucune dépendance).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OCCURRENCE_STATUS_COLORS, OCCURRENCE_STATUS_LABELS } from './preventiveConfig.js';

// Statuts écrits par le backend (api/preventive_occurrences/repo.py).
const BACKEND_STATUSES = ['pending', 'generated', 'in_progress', 'completed', 'skipped'];

test('chaque statut d\'occurrence du backend a un libellé et une couleur', () => {
  assert.deepEqual(Object.keys(OCCURRENCE_STATUS_LABELS).sort(), [...BACKEND_STATUSES].sort());
  assert.deepEqual(Object.keys(OCCURRENCE_STATUS_COLORS).sort(), [...BACKEND_STATUSES].sort());
});

test('échéancier : un libellé et une couleur par état de la route, regroupement et retard', async () => {
  const c = await import('./preventiveConfig.js');
  const states = ['overdue', 'due_soon', 'ok', 'not_computed'];
  assert.deepEqual(Object.keys(c.SCHEDULE_STATE_LABELS).sort(), [...states].sort());
  assert.deepEqual(Object.keys(c.SCHEDULE_STATE_COLORS).sort(), [...states].sort());
  const groups = c.groupSchedule([{ state: 'ok', plan_id: 'a' }, { state: 'overdue', plan_id: 'b' }]);
  assert.deepEqual(groups.map((g) => g.state), states);
  assert.equal(groups[0].rows[0].plan_id, 'b');
  assert.equal(c.overdueLabel(1), '1 jour de retard');
  assert.equal(c.overdueLabel(3), '3 jours de retard');
  assert.equal(c.overdueLabel(0), null);
  assert.equal(c.overdueLabel(null), null);
  assert.equal(c.overdueBadgeLabel(12), '+12 j');
  assert.equal(c.overdueBadgeLabel(0), null);
  assert.equal(c.overdueBadgeLabel(null), null);
});
