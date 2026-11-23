import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Model } from 'mongoose';
import type { RequestedReviewRow } from './map-requested-review-to-dto';
import { listRequestedReviewsCommand } from './list-requested-reviews.command';
import { listRequestedReviews } from './list-requested-reviews.usecase';

type ModelStub = Pick<Model<unknown>, 'aggregate'>;
type Stage = Record<string, unknown>;

const row = (overrides: Partial<RequestedReviewRow> = {}): RequestedReviewRow => ({
  _id: { toString: () => '65f000000000000000000001' },
  record_id: '1234567890123456789',
  status: 'in_review',
  reject_message: 'Scan is blurry',
  requested_reviews: {
    _id: { toString: () => '65f0000000000000000000b1' },
    requested_by: 'priya',
    requested_to: 'arun',
    status: 'pending',
    requested_at: new Date('2026-03-02T09:30:00.000Z'),
    messages: [{ username: 'priya', message: 'Please check page 3', added_at: new Date('2026-03-02T09:31:00.000Z') }],
    participants: ['priya', 'arun'],
  },
  ...overrides,
});

const stubModel = (rows: RequestedReviewRow[], total: number | null) => {
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

describe('listRequestedReviews', () => {
  it('orders by document _id, then array position, and pages the hops', async () => {
    const { model, pipelines, diskUse } = stubModel([row()], 2500);

    const result = await listRequestedReviews(listRequestedReviewsCommand.parse({ page: '2', limit: '500' }), model);

    const [items] = pipelines;
    const names = items.map((stage) => Object.keys(stage)[0]);
    assert.deepEqual(names, ['$match', '$project', '$sort', '$unwind', '$skip', '$limit']);
    assert.deepEqual(stageOf(items, '$sort'), { _id: 1 });
    assert.equal(stageOf(items, '$unwind'), '$requested_reviews');
    assert.equal(stageOf(items, '$skip'), 500);
    assert.equal(stageOf(items, '$limit'), 500);
    assert.deepEqual(diskUse, [true]);
    assert.equal(result.total, 2500);
    assert.equal(result.page, 2);
    assert.equal(result.limit, 500);
  });

  it('projects only the columns it maps, never anything else from the document', async () => {
    const { model, pipelines } = stubModel([], 0);

    await listRequestedReviews(listRequestedReviewsCommand.parse({}), model);

    assert.deepEqual(stageOf(pipelines[0], '$project'), { record_id: 1, status: 1, reject_message: 1, requested_reviews: 1 });
  });

  it('counts hops, not documents, with the same filter as the page', async () => {
    const { model, pipelines } = stubModel([], 0);

    await listRequestedReviews(listRequestedReviewsCommand.parse({ leadId: '99' }), model);

    const expected = { 'requested_reviews.0': { $exists: true }, record_id: '99' };
    assert.deepEqual(stageOf(pipelines[0], '$match'), expected);
    assert.deepEqual(stageOf(pipelines[1], '$match'), expected);
    assert.deepEqual(stageOf(pipelines[1], '$group'), { _id: null, total: { $sum: { $size: '$requested_reviews' } } });
  });

  it('only matches documents that have review hops when no filter is given', async () => {
    const { model, pipelines } = stubModel([], 0);

    await listRequestedReviews(listRequestedReviewsCommand.parse({}), model);

    assert.deepEqual(stageOf(pipelines[0], '$match'), { 'requested_reviews.0': { $exists: true } });
  });

  it('maps a hop to the row shape with its own id, the document id, the lead id and the document columns', async () => {
    const { model } = stubModel([row()], 1);

    const { data } = await listRequestedReviews(listRequestedReviewsCommand.parse({}), model);

    assert.deepEqual(data, [
      {
        externalId: '65f0000000000000000000b1',
        parentExternalId: '65f000000000000000000001',
        leadId: '1234567890123456789',
        requestedBy: 'priya',
        requestedTo: 'arun',
        status: 'pending',
        requestedAt: '2026-03-02T09:30:00.000Z',
        messages: [{ username: 'priya', message: 'Please check page 3', addedAt: '2026-03-02T09:31:00.000Z' }],
        participants: ['priya', 'arun'],
        documentStatus: 'in_review',
        rejectMessage: 'Scan is blurry',
      },
    ]);
  });

  it('answers null for missing values and empty lists for missing messages and participants', async () => {
    const base = row();
    const sparse = row({
      status: undefined,
      reject_message: null,
      requested_reviews: {
        _id: base.requested_reviews._id,
        requested_by: 'priya',
        requested_at: null,
        messages: [{ username: 'arun', message: 'ok', added_at: undefined }],
      },
    });
    const { model } = stubModel([sparse], 1);

    const { data } = await listRequestedReviews(listRequestedReviewsCommand.parse({}), model);

    assert.equal(data[0].requestedTo, null);
    assert.equal(data[0].status, null);
    assert.equal(data[0].requestedAt, null);
    assert.equal(data[0].documentStatus, null);
    assert.equal(data[0].rejectMessage, null);
    assert.deepEqual(data[0].participants, []);
    assert.equal(data[0].messages[0].addedAt, null);
  });

  it('reports a total of 0 when nothing matches', async () => {
    const { model } = stubModel([], null);

    const result = await listRequestedReviews(listRequestedReviewsCommand.parse({}), model);

    assert.deepEqual(result, { data: [], total: 0, page: 1, limit: 100 });
  });
});

describe('listRequestedReviewsCommand', () => {
  it('defaults to the first page of 100', () => {
    assert.deepEqual(listRequestedReviewsCommand.parse({}), { page: 1, limit: 100 });
  });

  it('rejects unknown query keys, an empty lead id and a bad page size', () => {
    for (const query of [{ from: '2026-01-01' }, { leadId: '' }, { limit: '1001' }, { page: '0' }]) {
      assert.equal(listRequestedReviewsCommand.safeParse(query).success, false, JSON.stringify(query));
    }
  });
});
