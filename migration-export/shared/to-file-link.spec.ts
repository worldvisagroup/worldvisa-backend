import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { toFileLink } from './to-file-link';

const BASE = 'https://old.example.test/api/migration';

describe('toFileLink', () => {
  it('links an r2 file to the streaming endpoint without exposing the key', () => {
    const link = toFileLink(BASE, 'documents', 'abc', { storage_type: 'r2', r2_key: 'secret/key.pdf', file_name: 'a.pdf' });

    assert.deepEqual(link, {
      url: `${BASE}/files/documents/abc`,
      storageKind: 'r2',
      size: null,
      checksum: null,
      name: 'a.pdf',
    });
    assert.ok(!JSON.stringify(link).includes('secret'));
  });

  it('treats a row with no storage_type as workdrive', () => {
    const link = toFileLink(BASE, 'documents', 'abc', { workdrive_file_id: 'wd1', file_name: null });

    assert.equal(link?.storageKind, 'workdrive');
    assert.equal(link?.name, null);
  });

  it('returns null when the stored file id for its storage kind is missing', () => {
    assert.equal(toFileLink(BASE, 'documents', 'a', { storage_type: 'r2', workdrive_file_id: 'wd1' }), null);
    assert.equal(toFileLink(BASE, 'documents', 'a', { storage_type: 'workdrive', r2_key: 'k' }), null);
    assert.equal(toFileLink(BASE, 'documents', 'a', {}), null);
    assert.equal(toFileLink(BASE, 'documents', 'a', { storage_type: 'r2', r2_key: '' }), null);
  });

  it('adds the attachment position to the link when an index is given, including 0', () => {
    const stored = { storage_type: 'r2' as const, r2_key: 'k', file_name: 'a.pdf' };

    assert.equal(toFileLink(BASE, 'chat-messages', 'abc', stored, 0)?.url, `${BASE}/files/chat-messages/abc?index=0`);
    assert.equal(toFileLink(BASE, 'chat-messages', 'abc', stored, 2)?.url, `${BASE}/files/chat-messages/abc?index=2`);
    assert.equal(toFileLink(BASE, 'documents', 'abc', stored)?.url, `${BASE}/files/documents/abc`);
  });
});
