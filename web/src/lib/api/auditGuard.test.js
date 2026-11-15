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

test('auditGuard : les entités de l\'étape 4 sont reconnues', () => {
  const type = (url) => getAuditEntityType({ config: { url } });
  assert.equal(type('/admin/users/u1'), 'user');
  assert.equal(type('/api-keys/k1'), 'api_key');
  assert.equal(type('/admin/ip-blocklist/1'), 'ip_block');
  assert.equal(type('/admin/email-domain-rules/1'), 'email_domain_rule');
  assert.equal(type('/equipement-class/c1'), 'equipement_class');
  assert.equal(type('/home-view/admin/assignments/3'), 'role_home_view');
  assert.equal(type('/admin/inconnu/1'), null);
});

test('auditGuard : les entités de l\'étape 3 sont reconnues', () => {
  const type = (url) => getAuditEntityType({ config: { url } });
  assert.equal(type('/preventive-plans/abc'), 'preventive_plan');
  assert.equal(type('/parts/abc'), 'part');
  assert.equal(type('/parts/manufacturer-refs/abc'), 'part_manufacturer_ref');
  assert.equal(type('/parts/supplier-refs/abc'), 'part_supplier_ref');
  assert.equal(type('/manufacturer-items/abc'), 'manufacturer_item');
  assert.equal(type('/stock-items/abc'), 'stock_item');
  assert.equal(type('/stock-families/F'), 'stock_family');
  assert.equal(type('/stock-sub-families/F/S'), 'stock_sub_family');
  assert.equal(type('/stock-item-suppliers/abc'), 'stock_item_supplier');
  assert.equal(type('/suppliers/abc'), 'supplier');
  assert.equal(type('/supplier-order-lines/abc/purchase-requests/def'), 'supplier_order_line');
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

test('getAuditEntityType : création de sous-ressource → entité créée', () => {
  const type = (url) => getAuditEntityType({ config: { url } });
  assert.equal(type('/parts/p1/manufacturer-refs'), 'part_manufacturer_ref');
  assert.equal(type('/parts/manufacturer-refs/m1/supplier-refs'), 'part_supplier_ref');
  assert.equal(type('/parts/manufacturer-refs/m1'), 'part_manufacturer_ref');
  assert.equal(type('/parts/p1'), 'part');
});
