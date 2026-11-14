import { test } from 'node:test';
import assert from 'node:assert/strict';

import { selectableReasons } from './auditReasonFilter.js';

test('selectableReasons : motifs manual et user proposés, jamais auto ni system', () => {
  const reasons = [
    { code: 'EQUIPMENT_FAILURE', category: 'manual' },
    { code: 'DELETE_DUPLICATE', category: 'user' },
    { code: 'OTHER', category: 'user' },
    { code: 'ROUTINE', category: 'auto' },
    { code: 'SYSTEM_CASCADE', category: 'system' },
  ];
  assert.deepEqual(
    selectableReasons(reasons).map((r) => r.code),
    ['EQUIPMENT_FAILURE', 'DELETE_DUPLICATE', 'OTHER']
  );
});
