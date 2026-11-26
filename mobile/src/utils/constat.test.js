import test from 'node:test'
import assert from 'node:assert/strict'
import { toggleChoice, visibleQuestions } from './constat.js'

const Q = {
  code: 'LEVER', is_multiple: true, parent_choice_code: null,
  choices: [{ code: 'A' }, { code: 'B' }, { code: 'NONE', is_exclusive: true }],
}

test('choix exclusif : coché, il décoche les autres de sa question', () => {
  assert.deepEqual(toggleChoice([Q], ['A', 'B'], Q, 'NONE'), ['NONE'])
})

test('choix exclusif : un autre choix coché décoche l\'exclusif', () => {
  assert.deepEqual(toggleChoice([Q], ['NONE'], Q, 'A'), ['A'])
  assert.deepEqual(toggleChoice([Q], ['A'], Q, 'B'), ['A', 'B'])
})

test('choix exclusif : les autres questions restent intactes', () => {
  const other = { code: 'S', is_multiple: true, parent_choice_code: null, choices: [{ code: 'S1' }] }
  assert.deepEqual(toggleChoice([Q, other], ['A', 'S1'], Q, 'NONE'), ['S1', 'NONE'])
})

test('choix unique remplacé, sous-question retirée avec son parent', () => {
  const lever = { code: 'L', is_multiple: false, parent_choice_code: null, choices: [{ code: 'T' }, { code: 'U' }] }
  const freq = { code: 'F', is_multiple: false, parent_choice_code: 'T', choices: [{ code: 'F1' }] }
  assert.deepEqual(visibleQuestions([lever, freq], ['T']).map((q) => q.code), ['L', 'F'])
  assert.deepEqual(toggleChoice([lever, freq], ['T', 'F1'], lever, 'U'), ['U'])
})
