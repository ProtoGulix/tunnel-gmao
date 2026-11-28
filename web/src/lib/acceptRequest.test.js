import test from 'node:test';
import assert from 'node:assert/strict';
import { initialPriority, buildAcceptContext } from './acceptRequest.js';

test('priorité préremplie : celle de la demande, sinon normale', () => {
  assert.equal(initialPriority({ priorite: 'urgent' }), 'urgent');
  assert.equal(initialPriority({ priorite: 'faible' }), 'faible');
  assert.equal(initialPriority({ priorite: null }), 'normal');
  assert.equal(initialPriority({ priorite: 'inconnue' }), 'normal');
  assert.equal(initialPriority(null), 'normal');
});

test('contexte d\'acceptation : équipement et demande choisie', () => {
  const request = { id: 'r1', equipement: { id: 'e1', code: 'PR-01', name: 'Presse' } };
  const cb = { onCreated: () => {}, onCancel: () => {} };
  const ctx = buildAcceptContext(request, cb);
  assert.equal(ctx.equipementId, 'e1');
  assert.equal(ctx.equipementLabel, 'PR-01 — Presse');
  assert.equal(ctx.selectedRequest, request);
  assert.equal(ctx.onCreated, cb.onCreated);
  assert.equal(buildAcceptContext({ id: 'r2' }, cb), null);
});
