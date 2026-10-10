// Lancé par `npm test` (node --test, aucune dépendance).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { entityCodeLabel, entityCodeTitle, entityCodeUrl } from './entityCodeUrl.js';

test('URL par type', () => {
  assert.equal(entityCodeUrl('intervention', 'abc'), '/interventions?id=abc');
  assert.equal(entityCodeUrl('purchase_request', 'xyz'), '/achats?tab=requests&requestId=xyz');
  assert.equal(entityCodeUrl('autre', 'x'), null);
});

test('titre du lien', () => {
  assert.equal(entityCodeTitle('intervention', 'L1'), "Ouvrir l'intervention L1");
  assert.equal(entityCodeTitle('purchase_request', 'DA-2026-0012'), "Ouvrir la demande d'achat DA-2026-0012");
});

test('libellé sans code', () => {
  assert.equal(entityCodeLabel(''), 'sans code');
  assert.equal(entityCodeLabel(null), 'sans code');
  assert.equal(entityCodeLabel('L1'), 'L1');
});
