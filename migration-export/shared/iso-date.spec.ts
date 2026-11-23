import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { toIsoOrNull } from './iso-date';

describe('toIsoOrNull', () => {
  it('formats a valid date as ISO', () => {
    assert.equal(toIsoOrNull(new Date('2024-05-01T10:00:00Z')), '2024-05-01T10:00:00.000Z');
  });

  it('returns null for missing, invalid and epoch values', () => {
    assert.equal(toIsoOrNull(null), null);
    assert.equal(toIsoOrNull(undefined), null);
    assert.equal(toIsoOrNull('not a date'), null);
    assert.equal(toIsoOrNull(new Date(0)), null);
  });
});
