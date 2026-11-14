import test from 'node:test';
import assert from 'node:assert/strict';
import { extractRejectedImportReport, getRejectedLines } from './csvImportReport.js';

const report = {
  total: 3,
  created: 0,
  errors: 2,
  lines: [
    { row: 3, status: 'error', error: 'Quantité invalide' },
    { row: 1, status: 'preview' },
    { row: 2, status: 'error', error: 'Référence vide' },
  ],
};

test('422 avec rapport : le rapport complet est rendu', () => {
  assert.equal(extractRejectedImportReport({ response: { status: 422, data: report } }), report);
});

test('autres erreurs : pas de rapport', () => {
  assert.equal(extractRejectedImportReport({ response: { status: 500, data: report } }), null);
  assert.equal(extractRejectedImportReport({ response: { status: 422, data: { detail: 'x' } } }), null);
  assert.equal(extractRejectedImportReport(new Error('réseau')), null);
});

test('lignes en erreur triées par numéro de ligne', () => {
  assert.deepEqual(getRejectedLines(report).map((l) => l.row), [2, 3]);
  assert.deepEqual(getRejectedLines(null), []);
});
