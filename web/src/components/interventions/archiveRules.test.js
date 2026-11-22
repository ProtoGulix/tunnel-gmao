import test from 'node:test';
import assert from 'node:assert/strict';
import { isArchivedClosed } from './archiveRules.js';

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
