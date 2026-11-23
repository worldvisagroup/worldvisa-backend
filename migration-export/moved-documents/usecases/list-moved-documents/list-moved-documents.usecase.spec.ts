import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Model } from 'mongoose';
import { listMovedDocumentsCommand } from './list-moved-documents.command';
import { buildMovedDocumentFilter, listMovedDocuments } from './list-moved-documents.usecase';
import { MOVED_DOCUMENT_COLUMNS, resolveStorageKind, type MovedDocumentRow } from './map-moved-document-to-dto';

type ModelStub = Pick<Model<MovedDocumentRow>, 'find' | 'countDocuments'>;

const BASE = 'https://old.example.test/api/migration';
const R2_KEY = 'visa-applications/ravi-123/deleted-documents/identity/passport-1700000000000.pdf';

const row = (overrides: Partial<MovedDocumentRow> = {}): MovedDocumentRow => ({
  _id: { toString: () => '65f000000000000000000010' },
  document_id: { toString: () => '65f000000000000000000001' },
  record_id: '1234567890123456789',
  file_name: 'passport.pdf',
  file_id: R2_KEY,
  moved_by: 'maya',
  moved_at: new Date('2025-04-01T08:00:00.000Z'),
  move_kind: 'reupload_archive',
  ...overrides,
});

const stubModel = (rows: MovedDocumentRow[], total: number) => {
  const calls: { filter: unknown; select?: string; sort?: unknown; skip?: number; limit?: number; diskUse?: boolean; lean?: boolean }[] = [];
  const counts: unknown[] = [];
  const model = {
    find: (filter: unknown) => {
      const call: (typeof calls)[number] = { filter };
      calls.push(call);
      const query = {
        select: (value: string) => ((call.select = value), query),
        sort: (value: unknown) => ((call.sort = value), query),
        skip: (value: number) => ((call.skip = value), query),
        limit: (value: number) => ((call.limit = value), query),
        allowDiskUse: (value: boolean) => ((call.diskUse = value), query),
        lean: () => ((call.lean = true), Promise.resolve(rows)),
      };
      return query;
    },
    countDocuments: (filter: unknown) => (counts.push(filter), Promise.resolve(total)),
  } as unknown as ModelStub;
  return { model, calls, counts };
};

describe('listMovedDocuments', () => {
  it('orders by _id, pages the rows and counts with the same filter', async () => {
    const { model, calls, counts } = stubModel([row()], 3810);

    const result = await listMovedDocuments(listMovedDocumentsCommand.parse({ page: '2', limit: '500', leadId: '77' }), BASE, model);

    const [call] = calls;
    assert.deepEqual(call.sort, { _id: 1 });
    assert.equal(call.skip, 500);
    assert.equal(call.limit, 500);
    assert.equal(call.diskUse, true);
    assert.equal(call.lean, true);
    assert.deepEqual(call.filter, { record_id: '77' });
    assert.deepEqual(counts, [{ record_id: '77' }]);
    assert.equal(result.total, 3810);
    assert.equal(result.page, 2);
    assert.equal(result.limit, 500);
  });

  it('selects only the allow-listed columns', async () => {
    const { model, calls } = stubModel([], 0);

    await listMovedDocuments(listMovedDocumentsCommand.parse({}), BASE, model);

    assert.equal(calls[0].select, MOVED_DOCUMENT_COLUMNS.join(' '));
  });

  it('maps a row to the contract with an R2 file link', async () => {
    const { model } = stubModel([row()], 1);

    const [dto] = (await listMovedDocuments(listMovedDocumentsCommand.parse({}), BASE, model)).data;

    assert.deepEqual(dto, {
      externalId: '65f000000000000000000010',
      leadId: '1234567890123456789',
      documentExternalId: '65f000000000000000000001',
      fileName: 'passport.pdf',
      movedBy: 'maya',
      movedAt: '2025-04-01T08:00:00.000Z',
      moveKind: 'reupload_archive',
      file: {
        url: `${BASE}/files/moved-documents/65f000000000000000000010`,
        storageKind: 'r2',
        size: null,
        checksum: null,
        name: 'passport.pdf',
      },
    });
  });

  it('links a WorkDrive file and never returns the stored file id', async () => {
    const { model } = stubModel([row({ file_id: 'wd9f8e7d6c5b4a', move_kind: 'full_move' })], 1);

    const result = await listMovedDocuments(listMovedDocumentsCommand.parse({}), BASE, model);

    assert.equal(result.data[0].file?.storageKind, 'workdrive');
    const json = JSON.stringify(result);
    assert.ok(!json.includes('wd9f8e7d6c5b4a'));
    assert.ok(!json.includes('deleted-documents'));
  });

  it('gives null for a missing move kind (762 old rows), a blank date and a missing file id', async () => {
    const { model } = stubModel([row({ move_kind: undefined, moved_at: '', file_id: undefined, moved_by: undefined })], 1);

    const [dto] = (await listMovedDocuments(listMovedDocumentsCommand.parse({}), BASE, model)).data;

    assert.equal(dto.moveKind, null);
    assert.equal(dto.movedAt, null);
    assert.equal(dto.movedBy, null);
    assert.equal(dto.file, null);
  });
});

describe('resolveStorageKind', () => {
  it('treats a path as an R2 key and a bare id as a WorkDrive id', () => {
    assert.equal(resolveStorageKind(R2_KEY), 'r2');
    assert.equal(resolveStorageKind('wd9f8e7d6c5b4a'), 'workdrive');
  });
});

describe('buildMovedDocumentFilter', () => {
  it('maps leadId to record_id and is empty without it', () => {
    assert.deepEqual(buildMovedDocumentFilter(listMovedDocumentsCommand.parse({ leadId: '77' })), { record_id: '77' });
    assert.deepEqual(buildMovedDocumentFilter(listMovedDocumentsCommand.parse({})), {});
  });
});

describe('listMovedDocumentsCommand', () => {
  it('rejects an unknown query key and applies the paging defaults', () => {
    assert.equal(listMovedDocumentsCommand.safeParse({ status: 'x' }).success, false);
    assert.deepEqual(listMovedDocumentsCommand.parse({}), { page: 1, limit: 100 });
    assert.equal(listMovedDocumentsCommand.safeParse({ limit: '1001' }).success, false);
  });
});
