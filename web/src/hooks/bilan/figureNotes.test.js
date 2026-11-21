import test from 'node:test';
import assert from 'node:assert/strict';
import { thresholdsLine, trendView } from './figureNotes.js';

test('seuils : sens above, valeurs de l\'API', () => {
  assert.equal(
    thresholdsLine('charge', { direction: 'above', orange: 75, red: 100 }),
    'Seuils : élevée dès 75 %, au plafond dès 100 %',
  );
});

test('seuils : sens below', () => {
  assert.equal(
    thresholdsLine('pilotage', { direction: 'below', orange: 20, red: 10 }),
    'Seuils : limité jusqu\'à 20 %, absent jusqu\'à 10 %',
  );
});

test('seuils : absents ou indicateur inconnu, pas de ligne', () => {
  assert.equal(thresholdsLine('charge', undefined), null);
  assert.equal(thresholdsLine('charge', { direction: 'above' }), null);
  assert.equal(thresholdsLine('autre', { direction: 'above', orange: 1, red: 2 }), null);
});

test('tendance : mots, null et valeur inconnue', () => {
  assert.deepEqual(trendView('up'), { key: 'up', word: 'en hausse' });
  assert.equal(trendView('stable').word, 'stable');
  assert.equal(trendView('down').word, 'en baisse');
  assert.equal(trendView(null), null);
  assert.equal(trendView(undefined), null);
  assert.equal(trendView('x'), null);
});
