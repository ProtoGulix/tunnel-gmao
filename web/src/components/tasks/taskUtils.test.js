import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canCloseTask, canDeleteTask, canSkipTask, deriveInitials, userFullName } from './taskUtils.js';

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

test('canCloseTask : Terminé et Annuler pour RESP et ADMIN sur tâche à faire ou en cours', () => {
  assert.equal(canCloseTask('todo', true), true);
  assert.equal(canCloseTask('in_progress', true), true);
  assert.equal(canCloseTask('done', true), false);
  assert.equal(canCloseTask('skipped', true), false);
  assert.equal(canCloseTask('todo', false), false);
  assert.equal(canCloseTask('in_progress', false), false);
});

test('canDeleteTask : seulement si l\'API l\'autorise (can_delete), champ absent = masqué', () => {
  assert.equal(canDeleteTask({ status: 'todo', can_delete: true }, true), true);
  assert.equal(canDeleteTask({ status: 'in_progress', can_delete: false }, true), false);
  assert.equal(canDeleteTask({ status: 'todo', can_delete: false, action_count: 1 }, true), false);
  assert.equal(canDeleteTask({ status: 'todo' }, true), false);
  assert.equal(canDeleteTask({ status: 'todo', can_delete: true }, false), false);
});
