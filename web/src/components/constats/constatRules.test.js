import test from 'node:test';
import assert from 'node:assert/strict';
import { visibleQuestions, toggleChoice, choicesOf, isConstatRequired, groupAnswers, requestState } from './constatRules.js';

const Q = [
  { code: 'LEVER', is_multiple: false, parent_choice_code: null, choices: [{ code: 'TASK' }, { code: 'TRAIN' }] },
  { code: 'FREQ', is_multiple: false, parent_choice_code: 'TASK', choices: [{ code: 'F_DAY' }, { code: 'F_MONTH' }] },
  { code: 'SIGNAL', is_multiple: true, parent_choice_code: null, choices: [{ code: 'S_A' }, { code: 'S_B' }] },
];

test('constat : sous-question visible si son choix parent est coché', () => {
  assert.deepEqual(visibleQuestions(Q, []).map((q) => q.code), ['LEVER', 'SIGNAL']);
  assert.deepEqual(visibleQuestions(Q, ['TASK']).map((q) => q.code), ['LEVER', 'FREQ', 'SIGNAL']);
});

test('constat : choix unique remplacé, choix multiple cumulé', () => {
  assert.deepEqual(toggleChoice(Q, ['TASK'], Q[0], 'TRAIN'), ['TRAIN']);
  assert.deepEqual(toggleChoice(Q, ['S_A'], Q[2], 'S_B'), ['S_A', 'S_B']);
  assert.deepEqual(toggleChoice(Q, ['S_A', 'S_B'], Q[2], 'S_A'), ['S_B']);
});

test('constat : décocher le parent retire la réponse de la sous-question', () => {
  assert.deepEqual(toggleChoice(Q, ['TASK', 'F_DAY', 'S_A'], Q[0], 'TASK'), ['S_A']);
  assert.deepEqual(toggleChoice(Q, ['TASK', 'F_DAY'], Q[0], 'TRAIN'), ['TRAIN']);
});

test('constat : choicesOf lit les réponses', () => {
  assert.deepEqual(choicesOf({ answers: [{ choice_code: 'A' }, { choice_code: 'B' }] }), ['A', 'B']);
  assert.deepEqual(choicesOf(null), []);
});

test('isConstatRequired : type trouvé par son id (forme de GET /interventions/types)', () => {
  const types = [{ id: 'CUR', title: 'Curatif', constat_required: true }, { id: 'PRE', constat_required: false }];
  assert.equal(isConstatRequired(types, 'CUR', []), true);
  assert.equal(isConstatRequired(types, 'CUR', [{ id: 'c1' }]), false);
  assert.equal(isConstatRequired(types, 'PRE', []), false);
  assert.equal(isConstatRequired(types, 'INCONNU', []), false);
  assert.equal(isConstatRequired(types, 'CUR', null), false);
});

test('groupAnswers regroupe par question dans l\'ordre reçu', () => {
  const answers = [
    { choice_code: 'a', label: 'A', question_label: 'Cause' },
    { choice_code: 'b', label: 'B', question_label: 'Suite' },
    { choice_code: 'c', label: 'C', question_label: 'Cause' },
  ];
  const groups = groupAnswers(answers);
  assert.deepEqual(groups.map((g) => g.question), ['Cause', 'Suite']);
  assert.deepEqual(groups[0].choices.map((c) => c.choice_code), ['a', 'c']);
});

test('groupAnswers sans question_label : un seul groupe', () => {
  assert.equal(groupAnswers([{ choice_code: 'a', label: 'A' }, { choice_code: 'b', label: 'B' }]).length, 1);
});

test('requestState : les quatre cas', () => {
  assert.equal(requestState({ request_status: 'nouvelle' }).kind, 'pending');
  assert.equal(requestState({ request_status: 'en_attente' }).kind, 'pending');
  assert.deepEqual(requestState({ request_status: 'acceptee', request_intervention_id: 'i', request_intervention_code: 'INT-1' }), { kind: 'accepted', id: 'i', code: 'INT-1' });
  assert.deepEqual(requestState({ request_status: 'rejetee' }), { kind: 'rejected' });
  assert.deepEqual(
    requestState({ request_status: 'rejetee', linked_request_id: 'u9', linked_request_code: 'DI-9' }),
    { kind: 'linked', id: 'u9', code: 'DI-9' },
  );
  assert.equal(requestState({}), null);
});
