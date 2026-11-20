import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDeleteBlockReason,
  getRequestOutcomeOptions,
  buildDeleteParams,
  OUTCOME_REOPEN,
  OUTCOME_DELETE,
} from './deleteInterventionRules.js';

test('intervention fermée : suppression bloquée avec explication', () => {
  assert.match(getDeleteBlockReason({ isLocked: true, stats: {} }), /fermée/);
  assert.match(getDeleteBlockReason({ stats: {} }), /fermée/);
});

test('actions ou achats liés : suppression bloquée', () => {
  assert.ok(getDeleteBlockReason({ isLocked: false, stats: { actionCount: 2 } }));
  assert.ok(getDeleteBlockReason({ isLocked: false, stats: { purchaseCount: 1 } }));
  assert.equal(getDeleteBlockReason({ isLocked: false, stats: { actionCount: 0 } }), null);
});

test('sans demande : aucun choix d\'issue', () => {
  assert.equal(getRequestOutcomeOptions(null).needsChoice, false);
});

test('demande ordinaire : les deux issues sont possibles', () => {
  const o = getRequestOutcomeOptions({ id: 'r1', isSystem: false });
  assert.equal(o.needsChoice, true);
  assert.equal(o.canDeleteRequest, true);
});

test('demande préventive : supprimer la demande désactivé avec explication', () => {
  const o = getRequestOutcomeOptions({ id: 'r1', isSystem: true });
  assert.equal(o.needsChoice, true);
  assert.equal(o.canDeleteRequest, false);
  assert.ok(o.deleteRequestHint);
});

test('paramètre request_outcome envoyé seulement avec une demande', () => {
  assert.deepEqual(buildDeleteParams({ id: 'r1' }, OUTCOME_REOPEN), { request_outcome: 'reopen' });
  assert.deepEqual(buildDeleteParams({ id: 'r1' }, OUTCOME_DELETE), { request_outcome: 'delete' });
  assert.equal(buildDeleteParams(null, OUTCOME_REOPEN), undefined);
});
