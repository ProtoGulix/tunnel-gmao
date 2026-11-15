// Lancé par `npm test` (node --test, aucune dépendance).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OCCURRENCE_STATUS_COLORS, OCCURRENCE_STATUS_LABELS } from './preventiveConfig.js';

// Statuts écrits par le backend (api/preventive_occurrences/repo.py).
const BACKEND_STATUSES = ['pending', 'generated', 'in_progress', 'completed', 'skipped'];

test('chaque statut d\'occurrence du backend a un libellé et une couleur', () => {
  assert.deepEqual(Object.keys(OCCURRENCE_STATUS_LABELS).sort(), [...BACKEND_STATUSES].sort());
  assert.deepEqual(Object.keys(OCCURRENCE_STATUS_COLORS).sort(), [...BACKEND_STATUSES].sort());
});
