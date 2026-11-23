import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Model } from 'mongoose';
import { listStageDocumentsCommand } from './list-stage-documents.command';
import { buildStageDocumentFilter, listStageDocuments } from './list-stage-documents.usecase';
import { STAGE_DOCUMENT_COLUMNS, type StageDocumentRow } from './map-stage-document-to-dto';

type ModelStub = Pick<Model<StageDocumentRow>, 'find' | 'countDocuments'>;

const BASE = 'https://old.example.test/api/migration';

const row = (overrides: Partial<StageDocumentRow> = {}): StageDocumentRow => ({
  _id: { toString: () => '65f000000000000000000001' },
  record_id: '1234567890123456789',
  storage_type: 'r2',
  r2_key: 'stage/internal-key.pdf',
  file_name: 'invitation.pdf',
  document_name: 'Invitation',
  document_type: 'Invitation letter',
  type: 'invitation',
  invitation_type: 'state nomination',
  outcome: 'Positive',
  outcome_date: new Date('2025-02-01T00:00:00.000Z'),
  skill_assessing_body: 'ACS',
  language_assessing_body: 'IELTS',
  subclass: '190',
  state: 'NSW',
  point: 85,
  date: new Date('2025-02-02T00:00:00.000Z'),
  deadline: new Date('2025-04-01T00:00:00.000Z'),
  expiry_at: new Date('2025-06-01T00:00:00.000Z'),
  uploaded_by: 'ravi',
  uploaded_at: new Date('2025-02-03T10:00:00.000Z'),
  createdAt: new Date('2025-02-03T10:00:00.000Z'),
  updatedAt: new Date('2025-02-04T10:00:00.000Z'),
  ...overrides,
});

const stubModel = (rows: StageDocumentRow[], total: number) => {
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

describe('listStageDocuments', () => {
  it('orders by created time then _id, pages the rows and counts with the same filter', async () => {
    const { model, calls, counts } = stubModel([row()], 6101);

    const result = await listStageDocuments(listStageDocumentsCommand.parse({ page: '3', limit: '500', type: 'eoi' }), BASE, model);

    const [call] = calls;
    assert.deepEqual(call.sort, { createdAt: 1, _id: 1 });
    assert.equal(call.skip, 1000);
    assert.equal(call.limit, 500);
    assert.equal(call.diskUse, true);
    assert.equal(call.lean, true);
    assert.deepEqual(call.filter, { type: 'eoi' });
    assert.deepEqual(counts, [{ type: 'eoi' }]);
    assert.equal(result.total, 6101);
    assert.equal(result.page, 3);
    assert.equal(result.limit, 500);
  });

  it('selects only the allow-listed columns', async () => {
    const { model, calls } = stubModel([], 0);

    await listStageDocuments(listStageDocumentsCommand.parse({}), BASE, model);

    assert.equal(calls[0].select, STAGE_DOCUMENT_COLUMNS.join(' '));
    for (const withheld of ['download_url', 'document_link', 'workdrive_parent_id', 'last_expiry_reminder_sent_at']) {
      assert.ok(!calls[0].select?.split(' ').includes(withheld), withheld);
    }
  });

  it('maps a row to the contract', async () => {
    const { model } = stubModel([row()], 1);

    const [dto] = (await listStageDocuments(listStageDocumentsCommand.parse({}), BASE, model)).data;

    assert.deepEqual(dto, {
      externalId: '65f000000000000000000001',
      leadId: '1234567890123456789',
      type: 'invitation',
      invitationType: 'state nomination',
      fileName: 'invitation.pdf',
      documentName: 'Invitation',
      documentType: 'Invitation letter',
      outcome: 'Positive',
      outcomeDate: '2025-02-01T00:00:00.000Z',
      skillAssessingBody: 'ACS',
      languageAssessingBody: 'IELTS',
      subclass: '190',
      state: 'NSW',
      point: 85,
      date: '2025-02-02T00:00:00.000Z',
      deadline: '2025-04-01T00:00:00.000Z',
      expiryAt: '2025-06-01T00:00:00.000Z',
      uploadedBy: 'ravi',
      uploadedAt: '2025-02-03T10:00:00.000Z',
      createdAt: '2025-02-03T10:00:00.000Z',
      modifiedAt: '2025-02-04T10:00:00.000Z',
      file: {
        url: `${BASE}/files/stage-documents/65f000000000000000000001`,
        storageKind: 'r2',
        size: null,
        checksum: null,
        name: 'invitation.pdf',
      },
    });
  });

  it('never returns storage ids', async () => {
    const { model } = stubModel([row({ workdrive_file_id: 'wd-secret' })], 1);

    const json = JSON.stringify(await listStageDocuments(listStageDocumentsCommand.parse({}), BASE, model));

    assert.ok(!json.includes('internal-key'));
    assert.ok(!json.includes('wd-secret'));
  });

  it('returns null for blank, missing or 1970 dates, a missing point, and a null file when nothing is stored', async () => {
    const { model } = stubModel(
      [
        row({
          storage_type: 'workdrive',
          r2_key: undefined,
          workdrive_file_id: undefined,
          invitation_type: undefined,
          point: undefined,
          outcome_date: '',
          date: '',
          deadline: new Date(0),
          expiry_at: undefined,
        }),
      ],
      1
    );

    const [dto] = (await listStageDocuments(listStageDocumentsCommand.parse({}), BASE, model)).data;

    assert.equal(dto.outcomeDate, null);
    assert.equal(dto.date, null);
    assert.equal(dto.deadline, null);
    assert.equal(dto.expiryAt, null);
    assert.equal(dto.point, null);
    assert.equal(dto.invitationType, null);
    assert.equal(dto.file, null);
  });

  it('keeps a point of zero', async () => {
    const { model } = stubModel([row({ point: 0 })], 1);

    const [dto] = (await listStageDocuments(listStageDocumentsCommand.parse({}), BASE, model)).data;

    assert.equal(dto.point, 0);
  });
});

describe('buildStageDocumentFilter', () => {
  it('maps leadId to record_id and keeps type', () => {
    assert.deepEqual(buildStageDocumentFilter(listStageDocumentsCommand.parse({ leadId: '77', type: 'roi' })), {
      record_id: '77',
      type: 'roi',
    });
  });

  it('applies from inclusive and to exclusive on createdAt', () => {
    const filter = buildStageDocumentFilter(listStageDocumentsCommand.parse({ from: '2025-01-01', to: '2025-02-01' }));

    assert.deepEqual(filter, { createdAt: { $gte: new Date('2025-01-01'), $lt: new Date('2025-02-01') } });
  });

  it('is empty without filters', () => {
    assert.deepEqual(buildStageDocumentFilter(listStageDocumentsCommand.parse({})), {});
  });
});

describe('listStageDocumentsCommand', () => {
  it('rejects an unknown query key, an unknown type and a reversed range', () => {
    assert.equal(listStageDocumentsCommand.safeParse({ status: 'x' }).success, false);
    assert.equal(listStageDocumentsCommand.safeParse({ type: 'passport' }).success, false);
    assert.equal(listStageDocumentsCommand.safeParse({ from: '2025-02-01', to: '2025-01-01' }).success, false);
  });

  it('applies the paging defaults and limits', () => {
    assert.deepEqual(listStageDocumentsCommand.parse({}), { page: 1, limit: 100 });
    assert.equal(listStageDocumentsCommand.safeParse({ limit: '1001' }).success, false);
  });
});
