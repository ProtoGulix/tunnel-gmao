import test from 'node:test';
import assert from 'node:assert/strict';
import { healthFetchOptions } from './healthRequest.js';

test('test de santé : les cookies du même domaine sont envoyés (Cloudflare Access)', () => {
  const options = healthFetchOptions(undefined);
  assert.equal(options.credentials, 'same-origin');
  assert.notEqual(options.mode, 'no-cors');
  assert.equal(options.cache, 'no-store');
});
