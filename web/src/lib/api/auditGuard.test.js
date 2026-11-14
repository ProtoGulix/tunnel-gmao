import test from 'node:test';
import assert from 'node:assert/strict';
import { getAuditEntityType, getAuditDecisionType } from './auditEntity.js';
import { filterReasonsByDecision, DECISION_DELETED } from './auditReasonFilter.js';

test('auditGuard : les entités de l\'étape 2 sont reconnues', () => {
  const type = (url) => getAuditEntityType({ config: { url } });
  assert.equal(type('/supplier-orders/abc'), 'supplier_order');
  assert.equal(type('/equipements/abc'), 'equipement');
  assert.equal(type('/preventive-occurrences/abc/skip'), 'preventive_occurrence');
  assert.equal(type('/interventions/abc'), 'intervention');
  assert.equal(type('/inconnu/abc'), null);
});

test('auditGuard : une requête DELETE attend un motif de suppression', () => {
  assert.equal(getAuditDecisionType({ config: { method: 'delete' } }), 'deleted');
  assert.equal(getAuditDecisionType({ config: { method: 'DELETE' } }), 'deleted');
  assert.equal(getAuditDecisionType({ config: { method: 'patch' } }), undefined);
});

test('filtre deleted : seuls les motifs de suppression sont gardés', () => {
  const reasons = [
    { code: 'DELETE_DUPLICATE', decision_types: ['deleted'] },
    { code: 'OTHER', decision_types: ['deleted', 'task_done'] },
    { code: 'TASK_DONE_UNRECORDED', decision_types: ['task_done'] },
    { code: 'SANS_DECISION', decision_types: null },
    { code: 'ANCIEN' },
  ];
  assert.deepEqual(
    filterReasonsByDecision(reasons, DECISION_DELETED).map((r) => r.code),
    ['DELETE_DUPLICATE', 'OTHER']
  );
});

test('filtre sans décision : liste inchangée', () => {
  const reasons = [{ code: 'A' }];
  assert.equal(filterReasonsByDecision(reasons, undefined), reasons);
});
