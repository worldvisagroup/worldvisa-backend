import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { describe, it } from 'node:test';
import { Readable } from 'node:stream';
import { FILE_SOURCES, getFileCommand } from './get-file.command';
import { FileStorageUnavailableError, isInaccessibleFile, openStoredFile, type FileStorage } from './file-storage';
import { findChatAttachment, getFile, type FileLookups } from './get-file.usecase';

const ID = '65f000000000000000000001';
const BYTES = Buffer.from('file-bytes');

const readAll = async (stream: Readable): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

const stubStorage = (overrides: Partial<FileStorage> = {}) => {
  const opened: { kind: string; id: string }[] = [];
  const storage: FileStorage = {
    openR2: async (key) => {
      opened.push({ kind: 'r2', id: key });
      return { stream: Readable.from([BYTES]), size: BYTES.length };
    },
    openWorkDrive: async (fileId) => {
      opened.push({ kind: 'workdrive', id: fileId });
      return { stream: Readable.from([BYTES]), size: null };
    },
    ...overrides,
  };
  return { storage, opened };
};

const lookups = (stored: Awaited<ReturnType<FileLookups['documents']>>): FileLookups => ({
  documents: async () => stored,
  'moved-documents': async () => stored,
  'stage-documents': async () => stored,
  'chat-messages': async () => stored,
});

describe('getFile', () => {
  it('opens an R2 row by its key and returns the stored name and size', async () => {
    const { storage, opened } = stubStorage();

    const result = await getFile(
      { source: 'documents', externalId: ID, checksum: false },
      storage,
      lookups({ storage_type: 'r2', r2_key: 'a/b.pdf', file_name: 'passport.pdf' })
    );

    assert.deepEqual(opened, [{ kind: 'r2', id: 'a/b.pdf' }]);
    assert.equal(result?.name, 'passport.pdf');
    assert.equal(result?.size, BYTES.length);
    assert.equal(result?.checksum, null);
    assert.deepEqual(await readAll(result!.stream), BYTES);
  });

  it('treats a row with no storage type as a WorkDrive file', async () => {
    const { storage, opened } = stubStorage();

    await getFile({ source: 'stage-documents', externalId: ID, checksum: false }, storage, lookups({ workdrive_file_id: 'wd-1', file_name: 'a.pdf' }));

    assert.deepEqual(opened, [{ kind: 'workdrive', id: 'wd-1' }]);
  });

  it('answers null for an unknown row, a row without a stored id and bytes the storage no longer has', async () => {
    const { storage } = stubStorage({ openR2: async () => null });

    assert.equal(await getFile({ source: 'documents', externalId: ID, checksum: false }, storage, lookups(null)), null);
    assert.equal(await getFile({ source: 'documents', externalId: ID, checksum: false }, storage, lookups({ storage_type: 'r2', r2_key: null })), null);
    assert.equal(await getFile({ source: 'documents', externalId: ID, checksum: false }, storage, lookups({ storage_type: 'r2', r2_key: 'gone.pdf' })), null);
  });

  it('computes the SHA-256 and the real size only when asked', async () => {
    const { storage } = stubStorage();

    const result = await getFile({ source: 'documents', externalId: ID, checksum: true }, storage, lookups({ storage_type: 'workdrive', workdrive_file_id: 'wd-1' }));

    assert.equal(result?.checksum, createHash('sha256').update(BYTES).digest('hex'));
    assert.equal(result?.size, BYTES.length);
    assert.equal(result?.name, null);
    assert.deepEqual(await readAll(result!.stream), BYTES);
  });

  it('lets a storage outage propagate so the controller can answer 503', async () => {
    const { storage } = stubStorage({
      openR2: async () => {
        throw new FileStorageUnavailableError();
      },
    });

    await assert.rejects(
      getFile({ source: 'documents', externalId: ID, checksum: false }, storage, lookups({ storage_type: 'r2', r2_key: 'a.pdf' })),
      FileStorageUnavailableError
    );
  });
});

describe('openStoredFile', () => {
  it('never calls the storage when the stored id is missing', async () => {
    const { storage, opened } = stubStorage();

    assert.equal(await openStoredFile({ storage_type: 'workdrive', workdrive_file_id: '' }, storage), null);
    assert.equal(await openStoredFile({ storage_type: 'r2' }, storage), null);
    assert.deepEqual(opened, []);
  });
});

describe('getFileCommand', () => {
  it('accepts every source, with an attachment index only for chat-messages', () => {
    for (const source of FILE_SOURCES) {
      const query = source === 'chat-messages' ? { source, externalId: ID, index: '0' } : { source, externalId: ID };
      assert.equal(getFileCommand.safeParse(query).success, true, source);
    }
  });

  it('requires the attachment index for chat-messages and rejects it for the other sources', () => {
    assert.equal(getFileCommand.safeParse({ source: 'chat-messages', externalId: ID }).success, false);
    assert.equal(getFileCommand.safeParse({ source: 'documents', externalId: ID, index: '0' }).success, false);
  });

  it('parses the attachment index as a non-negative integer', () => {
    assert.equal(getFileCommand.parse({ source: 'chat-messages', externalId: ID, index: '2' }).index, 2);
    for (const index of ['-1', '1.5', 'x']) {
      assert.equal(getFileCommand.safeParse({ source: 'chat-messages', externalId: ID, index }).success, false, index);
    }
  });

  it('rejects an id that is not an ObjectId and unknown query keys', () => {
    assert.equal(getFileCommand.safeParse({ source: 'documents', externalId: 'not-an-id' }).success, false);
    assert.equal(getFileCommand.safeParse({ source: 'documents', externalId: ID, extra: '1' }).success, false);
  });

  it('turns ?checksum=true into a boolean and defaults to false', () => {
    assert.equal(getFileCommand.parse({ source: 'documents', externalId: ID, checksum: 'true' }).checksum, true);
    assert.equal(getFileCommand.parse({ source: 'documents', externalId: ID }).checksum, false);
    assert.equal(getFileCommand.safeParse({ source: 'documents', externalId: ID, checksum: 'yes' }).success, false);
  });

  it('treats WorkDrive 401 F900 as a gone file but any other 401 as an outage', () => {
    const denied = JSON.stringify({ errors: [{ id: 'F900', title: 'Authorization check failed.' }] });
    assert.equal(isInaccessibleFile(401, denied), true);
    assert.equal(isInaccessibleFile(403, denied), true);
    assert.equal(isInaccessibleFile(401, JSON.stringify({ errors: [{ id: 'F7003' }] })), false);
    assert.equal(isInaccessibleFile(401, 'not json'), false);
    assert.equal(isInaccessibleFile(500, denied), false);
    assert.equal(isInaccessibleFile(undefined, denied), false);
  });
});

describe('findChatAttachment', () => {
  const stubMessages = (row: { attachments?: Array<{ url?: string; name?: string }> } | null) => {
    const filters: Record<string, unknown>[] = [];
    const columns: string[] = [];
    const messages = {
      findOne: (filter: Record<string, unknown>) => {
        filters.push(filter);
        return {
          select: (selected: string) => {
            columns.push(selected);
            return { lean: async () => row };
          },
        };
      },
    };
    return { messages, filters, columns };
  };

  const attachments = [
    { url: 'https://pub.example.test/chat-attachments/c1/1-a.pdf', name: 'a.pdf' },
    { url: 'https://pub.example.test/chat-attachments/c1/2-b.png', name: 'b.png' },
  ];

  it('picks the attachment at the index and answers its R2 key and name', async () => {
    const { messages } = stubMessages({ attachments });

    assert.deepEqual(await findChatAttachment(messages)(ID, 1), { storage_type: 'r2', r2_key: 'chat-attachments/c1/2-b.png', file_name: 'b.png' });
    assert.deepEqual(await findChatAttachment(messages)(ID), { storage_type: 'r2', r2_key: 'chat-attachments/c1/1-a.pdf', file_name: 'a.pdf' });
  });

  it('never serves a deleted message and reads only the attachments column', async () => {
    const { messages, filters, columns } = stubMessages({ attachments });

    await findChatAttachment(messages)(ID, 0);

    assert.deepEqual(filters, [{ _id: ID, deletedAt: null }]);
    assert.deepEqual(columns, ['attachments']);
  });

  it('answers null for an unknown message, a message without attachments and an index past the end', async () => {
    assert.equal(await findChatAttachment(stubMessages(null).messages)(ID, 0), null);
    assert.equal(await findChatAttachment(stubMessages({}).messages)(ID, 0), null);
    assert.equal(await findChatAttachment(stubMessages({ attachments }).messages)(ID, 2), null);
  });
});
