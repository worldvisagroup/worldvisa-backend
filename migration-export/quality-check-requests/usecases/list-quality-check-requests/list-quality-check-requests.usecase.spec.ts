import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Model } from 'mongoose';
import { listQualityCheckRequestsCommand } from './list-quality-check-requests.command';
import { buildQualityCheckRequestFilter, listQualityCheckRequests } from './list-quality-check-requests.usecase';
import { QUALITY_CHECK_REQUEST_COLUMNS, type QualityCheckRequestRow } from './map-quality-check-request-to-dto';

type ModelStub = Pick<Model<QualityCheckRequestRow>, 'find' | 'countDocuments'>;

const row = (overrides: Partial<QualityCheckRequestRow> = {}): QualityCheckRequestRow => ({
  _id: { toString: () => '65f000000000000000000001' },
  leadId: '1234567890123456789',
  recordType: 'Visa_Applications',
  requested_by: 'ravi',
  requested_to: 'anita',
  status: 'reviewed',
  requested_at: new Date('2025-03-01T09:00:00.000Z'),
  messages: [
    { username: 'ravi', message: 'Please check', added_at: new Date('2025-03-01T09:05:00.000Z') },
    { username: 'anita', message: 'Done', added_at: new Date('2025-03-02T09:05:00.000Z') },
  ],
  migrated: false,
  createdAt: new Date('2025-03-01T09:00:00.000Z'),
  updatedAt: new Date('2025-03-02T09:05:00.000Z'),
  ...overrides,
});

const stubModel = (rows: QualityCheckRequestRow[], total: number) => {
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

describe('listQualityCheckRequests', () => {
  it('orders by created time then _id, pages the rows and counts with the same filter', async () => {
    const { model, calls, counts } = stubModel([row()], 38);

    const result = await listQualityCheckRequests(listQualityCheckRequestsCommand.parse({ page: '2', limit: '10', status: 'pending' }), model);

    const [call] = calls;
    assert.deepEqual(call.sort, { createdAt: 1, _id: 1 });
    assert.equal(call.skip, 10);
    assert.equal(call.limit, 10);
    assert.equal(call.diskUse, true);
    assert.equal(call.lean, true);
    assert.deepEqual(call.filter, { status: 'pending' });
    assert.deepEqual(counts, [{ status: 'pending' }]);
    assert.equal(result.total, 38);
    assert.equal(result.page, 2);
    assert.equal(result.limit, 10);
  });

  it('selects only the allow-listed columns', async () => {
    const { model, calls } = stubModel([], 0);

    await listQualityCheckRequests(listQualityCheckRequestsCommand.parse({}), model);

    assert.equal(calls[0].select, QUALITY_CHECK_REQUEST_COLUMNS.join(' '));
  });

  it('maps a row to the contract, keeping the messages in order', async () => {
    const { model } = stubModel([row()], 1);

    const [dto] = (await listQualityCheckRequests(listQualityCheckRequestsCommand.parse({}), model)).data;

    assert.deepEqual(dto, {
      externalId: '65f000000000000000000001',
      leadId: '1234567890123456789',
      recordType: 'Visa_Applications',
      requestedBy: 'ravi',
      requestedTo: 'anita',
      status: 'reviewed',
      requestedAt: '2025-03-01T09:00:00.000Z',
      messages: [
        { username: 'ravi', message: 'Please check', addedAt: '2025-03-01T09:05:00.000Z' },
        { username: 'anita', message: 'Done', addedAt: '2025-03-02T09:05:00.000Z' },
      ],
      migrated: false,
      createdAt: '2025-03-01T09:00:00.000Z',
      modifiedAt: '2025-03-02T09:05:00.000Z',
    });
  });

  it('does not return the message sub-document ids', async () => {
    const withId = row({
      messages: [{ _id: 'sub-id', username: 'ravi', message: 'hi', added_at: new Date('2025-03-01T09:05:00.000Z') } as never],
    });
    const { model } = stubModel([withId], 1);

    const json = JSON.stringify(await listQualityCheckRequests(listQualityCheckRequestsCommand.parse({}), model));

    assert.ok(!json.includes('sub-id'));
  });

  it('returns an empty messages list, null dates and the schema defaults when fields are missing', async () => {
    const { model } = stubModel(
      [
        row({
          status: undefined,
          messages: undefined,
          migrated: undefined,
          requested_at: new Date(0),
          createdAt: undefined,
          updatedAt: '',
        }),
      ],
      1
    );

    const [dto] = (await listQualityCheckRequests(listQualityCheckRequestsCommand.parse({}), model)).data;

    assert.deepEqual(dto.messages, []);
    assert.equal(dto.status, 'pending');
    assert.equal(dto.migrated, false);
    assert.equal(dto.requestedAt, null);
    assert.equal(dto.createdAt, null);
    assert.equal(dto.modifiedAt, null);
  });

  it('keeps migrated true', async () => {
    const { model } = stubModel([row({ migrated: true })], 1);

    const [dto] = (await listQualityCheckRequests(listQualityCheckRequestsCommand.parse({}), model)).data;

    assert.equal(dto.migrated, true);
  });
});

describe('buildQualityCheckRequestFilter', () => {
  it('keeps leadId, status and recordType', () => {
    assert.deepEqual(
      buildQualityCheckRequestFilter(
        listQualityCheckRequestsCommand.parse({ leadId: '77', status: 'reviewed', recordType: 'Spouse_Skill_Assessment' })
      ),
      { leadId: '77', status: 'reviewed', recordType: 'Spouse_Skill_Assessment' }
    );
  });

  it('applies from inclusive and to exclusive on createdAt', () => {
    const filter = buildQualityCheckRequestFilter(listQualityCheckRequestsCommand.parse({ from: '2025-01-01', to: '2025-02-01' }));

    assert.deepEqual(filter, { createdAt: { $gte: new Date('2025-01-01'), $lt: new Date('2025-02-01') } });
  });

  it('is empty without filters', () => {
    assert.deepEqual(buildQualityCheckRequestFilter(listQualityCheckRequestsCommand.parse({})), {});
  });
});

describe('listQualityCheckRequestsCommand', () => {
  it('rejects an unknown query key, status, record type and a reversed range', () => {
    assert.equal(listQualityCheckRequestsCommand.safeParse({ type: 'x' }).success, false);
    assert.equal(listQualityCheckRequestsCommand.safeParse({ status: 'done' }).success, false);
    assert.equal(listQualityCheckRequestsCommand.safeParse({ recordType: 'lead' }).success, false);
    assert.equal(listQualityCheckRequestsCommand.safeParse({ recordType: 'visa_application' }).success, false);
    assert.equal(listQualityCheckRequestsCommand.safeParse({ from: '2025-02-01', to: '2025-01-01' }).success, false);
  });

  it('applies the paging defaults and limits', () => {
    assert.deepEqual(listQualityCheckRequestsCommand.parse({}), { page: 1, limit: 100 });
    assert.equal(listQualityCheckRequestsCommand.safeParse({ limit: '1001' }).success, false);
  });
});
