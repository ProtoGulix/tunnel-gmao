import test from 'node:test';
import assert from 'node:assert/strict';
import { periodStartDate, monthFilters, periodFilters } from './dashboardFilters.js';

const NOW = new Date(2026, 10, 16);

test('12 mois : aucune date envoyée, le serveur applique son défaut', () => {
  assert.equal(periodStartDate('12', null, NOW), undefined);
});

test('6 et 24 mois : premier jour du mois, mois courant inclus', () => {
  assert.equal(periodStartDate('6', null, NOW), '2026-06-01');
  assert.equal(periodStartDate('24', null, NOW), '2024-12-01');
});

test('depuis la mise en service : date de la fiche, sinon défaut serveur', () => {
  assert.equal(periodStartDate('since', '2021-03-15', NOW), '2021-03-15');
  assert.equal(periodStartDate('since', null, NOW), undefined);
  assert.equal(periodStartDate('since', '2001-05-20', NOW), '2016-12-01');
});

test('filtres d un mois : bornes du mois, bornées à la période', () => {
  const period = { start: '2026-01-01', end: '2026-03-10' };
  assert.deepEqual(monthFilters('2026-02', period), { reportedFrom: '2026-02-01', reportedTo: '2026-02-28' });
  assert.deepEqual(monthFilters('2026-03', period), { reportedFrom: '2026-03-01', reportedTo: '2026-03-10' });
  assert.deepEqual(monthFilters('2026-01', { start: '2026-01-15', end: '2026-03-10' }), {
    reportedFrom: '2026-01-15',
    reportedTo: '2026-01-31',
  });
});

test('filtres de période : type optionnel', () => {
  const period = { start: '2026-01-01', end: '2026-03-31' };
  assert.deepEqual(periodFilters(period), { reportedFrom: '2026-01-01', reportedTo: '2026-03-31' });
  assert.deepEqual(periodFilters(period, 'CUR'), {
    reportedFrom: '2026-01-01',
    reportedTo: '2026-03-31',
    typeInter: 'CUR',
  });
});
