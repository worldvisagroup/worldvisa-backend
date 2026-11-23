import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Model } from 'mongoose';
import { listDocumentsCommand } from './list-documents.command';
import { buildDocumentFilter, listDocuments } from './list-documents.usecase';
import { DOCUMENT_COLUMNS, type DocumentRow } from './map-document-to-dto';

type ModelStub = Pick<Model<DocumentRow>, 'find' | 'countDocuments'>;

const BASE = 'https://old.example.test/api/migration';

const row = (overrides: Partial<DocumentRow> = {}): DocumentRow => ({
  _id: { toString: () => '65f000000000000000000001' },
  record_id: '1234567890123456789',
  storage_type: 'r2',
  r2_key: 'docs/internal-key.pdf',
  file_name: 'passport.pdf',
  document_name: 'Passport',
  document_type: 'Passport',
  document_category: 'Identity',
  description: 'Main applicant',
  status: 'approved',
  uploaded_by: 'ravi',
  uploaded_at: new Date('2025-03-01T10:00:00.000Z'),
  history: [
    { status: 'pending', changed_by: 'ravi', changed_at: new Date('2025-03-01T10:00:00.000Z') },
    { status: 'approved', changed_by: 'maya', changed_at: new Date('2025-03-02T09:30:00.000Z') },
  ],
  comments: [
    { comment: 'Looks good', added_by: 'maya', document_link: 'old link text', added_at: new Date('2025-03-02T09:31:00.000Z') },
  ],
  ...overrides,
});

const stubModel = (rows: DocumentRow[], total: number) => {
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

describe('listDocuments', () => {
  it('orders by _id, pages the rows and counts with the same filter', async () => {
    const { model, calls, counts } = stubModel([row()], 12480);

    const result = await listDocuments(listDocumentsCommand.parse({ page: '3', limit: '500', status: 'approved' }), BASE, model);

    const [call] = calls;
    assert.deepEqual(call.sort, { _id: 1 });
    assert.equal(call.skip, 1000);
    assert.equal(call.limit, 500);
    assert.equal(call.diskUse, true);
    assert.equal(call.lean, true);
    assert.deepEqual(call.filter, { status: 'approved' });
    assert.deepEqual(counts, [{ status: 'approved' }]);
    assert.equal(result.total, 12480);
    assert.equal(result.page, 3);
    assert.equal(result.limit, 500);
  });

  it('selects only the allow-listed columns', async () => {
    const { model, calls } = stubModel([], 0);

    await listDocuments(listDocumentsCommand.parse({}), BASE, model);

    assert.equal(calls[0].select, DOCUMENT_COLUMNS.join(' '));
    for (const withheld of ['requested_reviews', 'reject_message', 'timeline', 'moved_files', 'download_url', 'document_link', 'workdrive_parent_id']) {
      assert.ok(!calls[0].select?.split(' ').includes(withheld), withheld);
    }
  });

  it('maps a row to the contract, with history and comments in stored order', async () => {
    const { model } = stubModel([row()], 1);

    const [dto] = (await listDocuments(listDocumentsCommand.parse({}), BASE, model)).data;

    assert.deepEqual(dto, {
      externalId: '65f000000000000000000001',
      leadId: '1234567890123456789',
      fileName: 'passport.pdf',
      documentName: 'Passport',
      documentType: 'Passport',
      documentCategory: 'Identity',
      description: 'Main applicant',
      status: 'approved',
      uploadedBy: 'ravi',
      uploadedAt: '2025-03-01T10:00:00.000Z',
      history: [
        { status: 'pending', changedBy: 'ravi', changedAt: '2025-03-01T10:00:00.000Z' },
        { status: 'approved', changedBy: 'maya', changedAt: '2025-03-02T09:30:00.000Z' },
      ],
      comments: [{ comment: 'Looks good', addedBy: 'maya', documentLink: 'old link text', addedAt: '2025-03-02T09:31:00.000Z' }],
      file: {
        url: `${BASE}/files/documents/65f000000000000000000001`,
        storageKind: 'r2',
        size: null,
        checksum: null,
        name: 'passport.pdf',
      },
    });
  });

  it('never returns storage ids', async () => {
    const { model } = stubModel([row({ workdrive_file_id: 'wd-secret' })], 1);

    const result = await listDocuments(listDocumentsCommand.parse({}), BASE, model);

    const json = JSON.stringify(result);
    assert.ok(!json.includes('internal-key'));
    assert.ok(!json.includes('wd-secret'));
  });

  it('returns null dates for blank, missing or 1970 values, and null file when nothing is stored', async () => {
    const { model } = stubModel(
      [
        row({
          storage_type: 'workdrive',
          r2_key: undefined,
          workdrive_file_id: undefined,
          uploaded_at: '',
          history: [{ status: 'pending', changed_by: 'ravi', changed_at: new Date(0) }],
          comments: [{ comment: 'x', added_by: 'y' }],
        }),
      ],
      1
    );

    const [dto] = (await listDocuments(listDocumentsCommand.parse({}), BASE, model)).data;

    assert.equal(dto.uploadedAt, null);
    assert.equal(dto.history[0].changedAt, null);
    assert.equal(dto.comments[0].addedAt, null);
    assert.equal(dto.comments[0].documentLink, null);
    assert.equal(dto.file, null);
  });

  it('gives empty arrays when a row has no history or comments', async () => {
    const { model } = stubModel([row({ history: undefined, comments: undefined })], 1);

    const [dto] = (await listDocuments(listDocumentsCommand.parse({}), BASE, model)).data;

    assert.deepEqual(dto.history, []);
    assert.deepEqual(dto.comments, []);
  });
});

describe('buildDocumentFilter', () => {
  it('maps leadId to record_id and keeps status', () => {
    assert.deepEqual(buildDocumentFilter(listDocumentsCommand.parse({ leadId: '77', status: 'pending' })), {
      record_id: '77',
      status: 'pending',
    });
  });

  it('is empty without filters', () => {
    assert.deepEqual(buildDocumentFilter(listDocumentsCommand.parse({})), {});
  });
});

describe('listDocumentsCommand', () => {
  it('rejects an unknown query key and an unknown status', () => {
    assert.equal(listDocumentsCommand.safeParse({ recordType: 'x' }).success, false);
    assert.equal(listDocumentsCommand.safeParse({ status: 'archived' }).success, false);
  });

  it('applies the paging defaults and limits', () => {
    assert.deepEqual(listDocumentsCommand.parse({}), { page: 1, limit: 100 });
    assert.equal(listDocumentsCommand.safeParse({ limit: '1001' }).success, false);
  });
});
