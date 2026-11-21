import test from 'node:test';
import assert from 'node:assert/strict';
import { decisionTypeLabel, groupDecisions } from './auditSyntheseFormat.js';

test('libellé de décision : traduit un type connu, garde le code sinon', () => {
  assert.equal(decisionTypeLabel('status_actual_changed'), 'Statut modifié');
  assert.equal(decisionTypeLabel('inconnu_x'), 'inconnu_x');
});

test('décisions regroupées par type et motif, triées par total', () => {
  const rows = groupDecisions([
    { month: '2026-10', decision_type: 'created', reason_code: 'A', reason_label: 'Motif A', count: 1 },
    { month: '2026-11', decision_type: 'status_changed', reason_code: 'B', reason_label: 'Motif B', count: 3 },
    { month: '2026-11', decision_type: 'created', reason_code: 'A', reason_label: 'Motif A', count: 1 },
  ]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].reason, 'Motif B');
  assert.equal(rows[0].total, 3);
  assert.deepEqual(rows[1].byMonth, { '2026-10': 1, '2026-11': 1 });
});
