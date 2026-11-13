import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canSkipTask, deriveInitials, userFullName } from './taskUtils.js';

test('canSkipTask : étape de gamme obligatoire réservée à RESP et ADMIN', () => {
  const mandatory = { origin: 'plan', optional: false };
  assert.equal(canSkipTask(mandatory, false), false);
  assert.equal(canSkipTask(mandatory, true), true);
});

test('canSkipTask : gamme optionnelle et tâches manuelles toujours ignorables', () => {
  assert.equal(canSkipTask({ origin: 'plan', optional: true }, false), true);
  assert.equal(canSkipTask({ origin: 'tech', optional: false }, false), true);
  assert.equal(canSkipTask({ origin: 'resp' }, false), true);
});

test('canSkipTask : tâche de gamme sans indicateur optional est obligatoire', () => {
  assert.equal(canSkipTask({ origin: 'plan' }, false), false);
});

test('deriveInitials : initiales explicites puis prénom et nom', () => {
  assert.equal(deriveInitials(null), null);
  assert.equal(deriveInitials({ initial: 'ab' }), 'AB');
  assert.equal(deriveInitials({ first_name: 'Jean', last_name: 'Dupont' }), 'JD');
  assert.equal(deriveInitials({}), null);
});

test('userFullName : nom complet, sinon email', () => {
  assert.equal(userFullName({ id: 1, first_name: 'Jean', last_name: 'Dupont' }), 'Jean Dupont');
  assert.equal(userFullName({ id: 2, email: 'a@b.fr' }), 'a@b.fr');
});
