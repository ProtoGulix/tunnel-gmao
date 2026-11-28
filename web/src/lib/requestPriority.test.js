import test from 'node:test';
import assert from 'node:assert/strict';
import { isPriorityEditable } from './requestPriority.js';

test('urgence modifiable seulement pour une demande nouvelle ou en attente', () => {
  assert.equal(isPriorityEditable('nouvelle'), true);
  assert.equal(isPriorityEditable('en_attente'), true);
  assert.equal(isPriorityEditable('acceptee'), false);
  assert.equal(isPriorityEditable('rejetee'), false);
  assert.equal(isPriorityEditable(undefined), false);
});
