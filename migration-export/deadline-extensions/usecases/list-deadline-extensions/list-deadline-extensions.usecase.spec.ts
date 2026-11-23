import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Model } from 'mongoose';
import type { DeadlineExtensionRow } from './map-deadline-extension-to-dto';
import { listDeadlineExtensionsCommand } from './list-deadline-extensions.command';
import { APPROVAL_REQUESTS_COLLECTION, listDeadlineExtensions } from './list-deadline-extensions.usecase';

type ModelStub = Pick<Model<unknown>, 'aggregate'>;
type Stage = Record<string, unknown>;

const id = (value: string) => ({ toString: () => value });

const approvedRow = (overrides: Partial<DeadlineExtensionRow> = {}): DeadlineExtensionRow => ({
  _id: id('65f0000000000000000000a1'),
  parentExternalId: id('65f000000000000000000001'),
  kind: 'approved',
  leadId: '1234567890123456789',
  recordType: 'visa_application',
  fieldName: 'Deadline_For_Lodgment',
  previousValue: '2026-01-10',
  newValue: '2026-02-10',
  reason: 'Waiting for the skills result',
  requestedBy: 'agent.one',
  approvedBy: 'master.admin',
  approvedAt: new Date('2026-01-12T05:30:00.000Z'),
  requestId: id('65f0000000000000000000b1'),
  status: 'approved',
  rejectionReason: null,
  createdAt: new Date('2026-01-12T05:30:00.000Z'),
  ...overrides,
});

const requestRow = (overrides: Partial<DeadlineExtensionRow> = {}): DeadlineExtensionRow => ({
  _id: id('65f0000000000000000000c1'),
  parentExternalId: null,
  kind: 'request',
  leadId: '1234567890123456789',
  recordType: 'visa_application',
  fieldName: 'Deadline_For_Lodgment',
  previousValue: '2026-02-10',
  newValue: '2026-03-01',
  reason: 'Client travelling',
  requestedBy: 'agent.one',
  approvedBy: null,
  approvedAt: null,
  requestId: null,
  status: 'pending',
  rejectionReason: null,
  createdAt: new Date('2026-02-11T09:00:00.000Z'),
  ...overrides,
});

const stubModel = (rows: DeadlineExtensionRow[], total: number | null) => {
  const pipelines: Stage[][] = [];
  const diskUse: boolean[] = [];
  const model = {
    aggregate: (pipeline: Stage[]) => {
      pipelines.push(pipeline);
      const isTotal = pipeline.some((stage) => '$group' in stage);
      const result = isTotal ? (total === null ? [] : [{ total }]) : rows;
      return Object.assign(Promise.resolve(result), {
        allowDiskUse: (enabled: boolean) => (diskUse.push(enabled), Promise.resolve(result)),
      });
    },
  } as unknown as ModelStub;
  return { model, pipelines, diskUse };
};

const stageOf = (pipeline: Stage[], name: string) => pipeline.find((stage) => name in stage)?.[name];
const unionOf = (pipeline: Stage[]) => stageOf(pipeline, '$unionWith') as { coll: string; pipeline: Stage[] } | undefined;

describe('listDeadlineExtensions', () => {
  it('merges both sources, orders approved before request, then by created time and id, and pages the rows', async () => {
    const { model, pipelines, diskUse } = stubModel([approvedRow()], 299);

    const result = await listDeadlineExtensions(listDeadlineExtensionsCommand.parse({ page: '3', limit: '50' }), model);

    const [items] = pipelines;
    const names = items.map((stage) => Object.keys(stage)[0]);
    assert.deepEqual(names, ['$match', '$project', '$unwind', '$project', '$unionWith', '$sort', '$skip', '$limit']);
    assert.deepEqual(stageOf(items, '$sort'), { kind: 1, createdAt: 1, _id: 1 });
    assert.equal(stageOf(items, '$skip'), 100);
    assert.equal(stageOf(items, '$limit'), 50);
    assert.equal(unionOf(items)?.coll, APPROVAL_REQUESTS_COLLECTION);
    assert.deepEqual(diskUse, [true]);
    assert.equal(result.total, 299);
    assert.equal(result.page, 3);
    assert.equal(result.limit, 50);
  });

  it('counts rows of both sources with the same source pipeline as the page', async () => {
    const { model, pipelines } = stubModel([], 0);

    await listDeadlineExtensions(listDeadlineExtensionsCommand.parse({ leadId: '99' }), model);

    const [items, total] = pipelines;
    assert.deepEqual(total.slice(0, -1), items.slice(0, 5));
    assert.deepEqual(stageOf(total, '$group'), { _id: null, total: { $sum: 1 } });
  });

  it('matches only applications that have extensions and only field_change requests', async () => {
    const { model, pipelines } = stubModel([], 0);

    await listDeadlineExtensions(listDeadlineExtensionsCommand.parse({}), model);

    assert.deepEqual(stageOf(pipelines[0], '$match'), { 'deadline_extensions.0': { $exists: true } });
    assert.deepEqual(stageOf(unionOf(pipelines[0])!.pipeline, '$match'), { requestType: 'field_change' });
  });

  it('applies the lead and record type filters to both sources', async () => {
    const { model, pipelines } = stubModel([], 0);

    await listDeadlineExtensions(listDeadlineExtensionsCommand.parse({ leadId: '99', recordType: 'spouse_skill_assessment' }), model);

    assert.deepEqual(stageOf(pipelines[0], '$match'), {
      'deadline_extensions.0': { $exists: true },
      lead_id: '99',
      record_type: 'spouse_skill_assessment',
    });
    assert.deepEqual(stageOf(unionOf(pipelines[0])!.pipeline, '$match'), {
      requestType: 'field_change',
      leadId: '99',
      recordType: 'spouse_skill_assessment',
    });
  });

  it('reads only the embedded rows for kind=approved', async () => {
    const { model, pipelines } = stubModel([], 0);

    await listDeadlineExtensions(listDeadlineExtensionsCommand.parse({ kind: 'approved' }), model);

    assert.equal(unionOf(pipelines[0]), undefined);
    assert.deepEqual(stageOf(pipelines[0], '$match'), { 'deadline_extensions.0': { $exists: true } });
  });

  it('reads only the requests for kind=request, matching nothing from the embedded side', async () => {
    const { model, pipelines } = stubModel([], 0);

    await listDeadlineExtensions(listDeadlineExtensionsCommand.parse({ kind: 'request' }), model);

    assert.deepEqual(stageOf(pipelines[0], '$match'), { _id: { $in: [] } });
    assert.equal(pipelines[0].some((stage) => '$unwind' in stage), false);
    assert.equal(unionOf(pipelines[0])?.coll, APPROVAL_REQUESTS_COLLECTION);
  });

  it('treats a status filter as a request filter and leaves out the embedded rows', async () => {
    const { model, pipelines } = stubModel([], 0);

    await listDeadlineExtensions(listDeadlineExtensionsCommand.parse({ status: 'pending' }), model);

    assert.deepEqual(stageOf(pipelines[0], '$match'), { _id: { $in: [] } });
    assert.deepEqual(stageOf(unionOf(pipelines[0])!.pipeline, '$match'), { requestType: 'field_change', status: 'pending' });
  });

  it('maps an approved embedded row with its element id, the application id and the approval columns', async () => {
    const { model } = stubModel([approvedRow()], 1);

    const { data } = await listDeadlineExtensions(listDeadlineExtensionsCommand.parse({}), model);

    assert.deepEqual(data, [
      {
        externalId: '65f0000000000000000000a1',
        parentExternalId: '65f000000000000000000001',
        leadId: '1234567890123456789',
        recordType: 'visa_application',
        kind: 'approved',
        fieldName: 'Deadline_For_Lodgment',
        previousValue: '2026-01-10',
        newValue: '2026-02-10',
        reason: 'Waiting for the skills result',
        requestedBy: 'agent.one',
        approvedBy: 'master.admin',
        approvedAt: '2026-01-12T05:30:00.000Z',
        requestId: '65f0000000000000000000b1',
        status: 'approved',
        rejectionReason: null,
        createdAt: '2026-01-12T05:30:00.000Z',
      },
    ]);
  });

  it('maps a pending request with no parent, no approval and no request id', async () => {
    const { model } = stubModel([requestRow()], 1);

    const { data } = await listDeadlineExtensions(listDeadlineExtensionsCommand.parse({}), model);

    assert.deepEqual(data[0], {
      externalId: '65f0000000000000000000c1',
      parentExternalId: null,
      leadId: '1234567890123456789',
      recordType: 'visa_application',
      kind: 'request',
      fieldName: 'Deadline_For_Lodgment',
      previousValue: '2026-02-10',
      newValue: '2026-03-01',
      reason: 'Client travelling',
      requestedBy: 'agent.one',
      approvedBy: null,
      approvedAt: null,
      requestId: null,
      status: 'pending',
      rejectionReason: null,
      createdAt: '2026-02-11T09:00:00.000Z',
    });
  });

  it('maps a rejected request with its reviewer, review time and reason', async () => {
    const rejected = requestRow({
      status: 'rejected',
      approvedBy: 'master.admin',
      approvedAt: new Date('2026-02-12T10:00:00.000Z'),
      rejectionReason: 'Not justified',
    });
    const { model } = stubModel([rejected], 1);

    const { data } = await listDeadlineExtensions(listDeadlineExtensionsCommand.parse({}), model);

    assert.equal(data[0].status, 'rejected');
    assert.equal(data[0].approvedBy, 'master.admin');
    assert.equal(data[0].approvedAt, '2026-02-12T10:00:00.000Z');
    assert.equal(data[0].rejectionReason, 'Not justified');
  });

  it('answers null for a missing previous value, record type and a 1970 or missing date', async () => {
    const sparse = approvedRow({
      previousValue: undefined,
      recordType: undefined,
      approvedAt: new Date(0),
      createdAt: undefined,
      requestId: undefined,
    });
    const { model } = stubModel([sparse], 1);

    const { data } = await listDeadlineExtensions(listDeadlineExtensionsCommand.parse({}), model);

    assert.equal(data[0].previousValue, null);
    assert.equal(data[0].recordType, null);
    assert.equal(data[0].approvedAt, null);
    assert.equal(data[0].createdAt, null);
    assert.equal(data[0].requestId, null);
  });

  it('reports a total of 0 when nothing matches', async () => {
    const { model } = stubModel([], null);

    const result = await listDeadlineExtensions(listDeadlineExtensionsCommand.parse({}), model);

    assert.deepEqual(result, { data: [], total: 0, page: 1, limit: 100 });
  });
});

describe('listDeadlineExtensionsCommand', () => {
  it('defaults to the first page of 100', () => {
    assert.deepEqual(listDeadlineExtensionsCommand.parse({}), { page: 1, limit: 100 });
  });

  it('accepts a kind and a request status together', () => {
    assert.equal(listDeadlineExtensionsCommand.safeParse({ kind: 'request', status: 'rejected' }).success, true);
  });

  it('rejects unknown keys, a bad kind or status, an empty lead id, a page size over 1000 and a status with kind=approved', () => {
    const bad = [
      { from: '2026-01-01' },
      { kind: 'other' },
      { status: 'done' },
      { leadId: '' },
      { limit: '1001' },
      { page: '0' },
      { kind: 'approved', status: 'pending' },
    ];
    for (const query of bad) {
      assert.equal(listDeadlineExtensionsCommand.safeParse(query).success, false, JSON.stringify(query));
    }
  });
});
