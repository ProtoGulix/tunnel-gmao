import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveSiteOptions } from './siteOptions.js';

test('aucun ou un seul site : pas d\'options, le filtre est masqué', () => {
  assert.deepEqual(deriveSiteOptions([]), []);
  assert.deepEqual(deriveSiteOptions([{ id: '1', name: 'Site A' }]), []);
  assert.deepEqual(deriveSiteOptions(undefined), []);
});

test('plusieurs sites : une option par racine, libellé nom puis code', () => {
  const options = deriveSiteOptions([
    { id: '1', code: 'A', name: 'Site A' },
    { id: '2', code: 'B' },
  ]);
  assert.deepEqual(options, [
    { value: '1', label: 'Site A' },
    { value: '2', label: 'B' },
  ]);
});
