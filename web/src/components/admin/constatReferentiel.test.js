import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NONE, orderQuestions, parentChoiceLabel, choiceToForm, choicePatch, isValidChoiceCode, newChoicePayload,
} from './constatReferentiel.js';

const CHOICE = { code: 'A', label: 'Aide', sort_order: 2, suggested_type_inter: 'CURATIF', creates_request: true, is_exclusive: false };
const QUESTIONS = [
  { id: 2, parent_choice_code: 'A', choices: [] },
  { id: 1, parent_choice_code: null, choices: [CHOICE] },
  { id: 3, parent_choice_code: null, choices: [] },
];

test('place la sous-question après sa question parente', () => {
  assert.deepEqual(orderQuestions(QUESTIONS).map((q) => q.id), [1, 2, 3]);
});

test('libellé du choix parent', () => {
  assert.equal(parentChoiceLabel(QUESTIONS[0], QUESTIONS), 'Aide');
  assert.equal(parentChoiceLabel(QUESTIONS[1], QUESTIONS), null);
});

test('aucun changement, aucun champ envoyé', () => {
  assert.deepEqual(choicePatch(CHOICE, choiceToForm(CHOICE)), {});
});

test('retirer le type envoie null', () => {
  const form = { ...choiceToForm(CHOICE), suggested_type_inter: NONE };
  assert.deepEqual(choicePatch(CHOICE, form), { suggested_type_inter: null });
});

test('envoie les champs modifiés', () => {
  const form = { ...choiceToForm(CHOICE), label: ' Autre ', sort_order: '5', is_exclusive: true };
  assert.deepEqual(choicePatch(CHOICE, form), { label: 'Autre', sort_order: 5, is_exclusive: true });
});

test('valide le code', () => {
  assert.equal(isValidChoiceCode('FORMATION_2'), true);
  assert.equal(isValidChoiceCode('a'), false);
  assert.equal(isValidChoiceCode('1AB'), false);
});

test('charge utile de création', () => {
  const form = { code: ' form ', label: ' Formation ', suggested_type_inter: NONE, creates_request: true, is_exclusive: false };
  assert.deepEqual(newChoicePayload(7, form), {
    question_id: 7, code: 'FORM', label: 'Formation', creates_request: true, is_exclusive: false,
  });
});
