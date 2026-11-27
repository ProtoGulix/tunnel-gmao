import test from 'node:test';
import assert from 'node:assert/strict';
import { canMarkPrinted, isArchivedClosed } from './archiveRules.js';

test('fermée et archivée : ne se rouvre pas', () => {
  assert.equal(isArchivedClosed({ status: 'ferme', printedFiche: true }), true);
  assert.equal(isArchivedClosed({ status: { id: 'ferme' }, printedFiche: true }), true);
});

test('fermée non archivée, ou archivée encore ouverte : rien à bloquer', () => {
  assert.equal(isArchivedClosed({ status: 'ferme', printedFiche: false }), false);
  assert.equal(isArchivedClosed({ status: 'ouvert', printedFiche: true }), false);
});

test('intervention absente : rien à bloquer', () => {
  assert.equal(isArchivedClosed(null), false);
});

test('marquer imprimée : visible sur une fermée non imprimée, avec le droit', () => {
  assert.equal(canMarkPrinted({ status: 'ferme', printedFiche: false }, true), true);
  assert.equal(canMarkPrinted({ status: { id: 'ferme' }, printedFiche: false }, true), true);
});

test('marquer imprimée : caché si ouverte, déjà imprimée ou sans droit', () => {
  assert.equal(canMarkPrinted({ status: 'ouvert', printedFiche: false }, true), false);
  assert.equal(canMarkPrinted({ status: 'ferme', printedFiche: true }, true), false);
  assert.equal(canMarkPrinted({ status: 'ferme', printedFiche: false }, false), false);
  assert.equal(canMarkPrinted(null, true), false);
});
