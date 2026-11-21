import test from 'node:test';
import assert from 'node:assert/strict';
import { toRoleOptions } from './roleOptions.js';

const ROLES = [
  { code: 'ADMIN', label: 'Administrateur' },
  { code: 'ACHETEUR', label: 'Acheteur' },
  { code: 'TECH', label: '' },
];

test('affiche le libellé et le code', () => {
  assert.deepEqual(toRoleOptions(ROLES)[1], { value: 'ACHETEUR', label: 'Acheteur (ACHETEUR)' });
});

test('retombe sur le code sans libellé', () => {
  assert.equal(toRoleOptions(ROLES)[2].label, 'TECH');
});

test('exclut le rôle actuel sans tenir compte de la casse', () => {
  assert.deepEqual(toRoleOptions(ROLES, 'admin').map((o) => o.value), ['ACHETEUR', 'TECH']);
});

test('tolère une liste absente', () => {
  assert.deepEqual(toRoleOptions(undefined), []);
});

test('ne propose pas le rôle des clés d\'API (MCP) à une personne', () => {
  const roles = [...ROLES, { code: 'MCP', label: 'MCP' }];
  assert.deepEqual(toRoleOptions(roles).map((o) => o.value), ['ADMIN', 'ACHETEUR', 'TECH']);
});
