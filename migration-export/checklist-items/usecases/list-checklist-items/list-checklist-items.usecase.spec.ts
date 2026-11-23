import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Model } from 'mongoose';
import type { ChecklistItemRow } from './map-checklist-item-to-dto';
import { listChecklistItemsCommand } from './list-checklist-items.command';
import { listChecklistItems } from './list-checklist-items.usecase';

type ModelStub = Pick<Model<unknown>, 'aggregate'>;
type Stage = Record<string, unknown>;

const row = (overrides: Partial<ChecklistItemRow> = {}): ChecklistItemRow => ({
  _id: { toString: () => '65f000000000000000000001' },
  lead_id: '1234567890123456789',
  record_type: 'visa_application',
  checklist: {
    _id: { toString: () => '65f0000000000000000000a1' },
    document_type: 'Passport',
    document_category: 'Identity',
    required: true,
    instructions: 'Colour scan of every page',
    description: 'Valid for 6 months',
  },
  ...overrides,
});

const stubModel = (rows: ChecklistItemRow[], total: number | null) => {
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

describe('listChecklistItems', () => {
  it('orders by application created time, _id, then array position, and pages the elements', async () => {
    const { model, pipelines, diskUse } = stubModel([row()], 4021);

    const result = await listChecklistItems(listChecklistItemsCommand.parse({ page: '3', limit: '500' }), model);

    const [items] = pipelines;
    const names = items.map((stage) => Object.keys(stage)[0]);
    assert.deepEqual(names, ['$match', '$project', '$sort', '$unwind', '$skip', '$limit']);
    assert.deepEqual(stageOf(items, '$sort'), { created_at: 1, _id: 1 });
    assert.equal(stageOf(items, '$unwind'), '$checklist');
    assert.equal(stageOf(items, '$skip'), 1000);
    assert.equal(stageOf(items, '$limit'), 500);
    assert.deepEqual(diskUse, [true]);
    assert.equal(result.total, 4021);
    assert.equal(result.page, 3);
    assert.equal(result.limit, 500);
  });

  it('projects only the columns it maps, never anything else from the application', async () => {
    const { model, pipelines } = stubModel([], 0);

    await listChecklistItems(listChecklistItemsCommand.parse({}), model);

    assert.deepEqual(stageOf(pipelines[0], '$project'), { lead_id: 1, record_type: 1, created_at: 1, checklist: 1 });
  });

  it('counts elements, not applications, with the same filter as the page', async () => {
    const { model, pipelines } = stubModel([], 0);

    await listChecklistItems(listChecklistItemsCommand.parse({ leadId: '99', recordType: 'spouse_skill_assessment' }), model);

    const expected = { 'checklist.0': { $exists: true }, lead_id: '99', record_type: 'spouse_skill_assessment' };
    assert.deepEqual(stageOf(pipelines[0], '$match'), expected);
    assert.deepEqual(stageOf(pipelines[1], '$match'), expected);
    assert.deepEqual(stageOf(pipelines[1], '$group'), { _id: null, total: { $sum: { $size: '$checklist' } } });
  });

  it('only matches applications that have checklist items when no filter is given', async () => {
    const { model, pipelines } = stubModel([], 0);

    await listChecklistItems(listChecklistItemsCommand.parse({}), model);

    assert.deepEqual(stageOf(pipelines[0], '$match'), { 'checklist.0': { $exists: true } });
  });

  it('maps an element to the row shape with its own id, the application id and the lead id', async () => {
    const { model } = stubModel([row()], 1);

    const { data } = await listChecklistItems(listChecklistItemsCommand.parse({}), model);

    assert.deepEqual(data, [
      {
        externalId: '65f0000000000000000000a1',
        parentExternalId: '65f000000000000000000001',
        leadId: '1234567890123456789',
        recordType: 'visa_application',
        documentType: 'Passport',
        documentCategory: 'Identity',
        required: true,
        instructions: 'Colour scan of every page',
        description: 'Valid for 6 months',
      },
    ]);
  });

  it('answers null for missing optional text and a missing record type, and keeps required false', async () => {
    const base = row();
    const sparse = row({
      record_type: undefined,
      checklist: { ...base.checklist, required: false, instructions: undefined, description: null },
    });
    const { model } = stubModel([sparse], 1);

    const { data } = await listChecklistItems(listChecklistItemsCommand.parse({}), model);

    assert.equal(data[0].recordType, null);
    assert.equal(data[0].required, false);
    assert.equal(data[0].instructions, null);
    assert.equal(data[0].description, null);
  });

  it('reports a total of 0 when nothing matches', async () => {
    const { model } = stubModel([], null);

    const result = await listChecklistItems(listChecklistItemsCommand.parse({}), model);

    assert.deepEqual(result, { data: [], total: 0, page: 1, limit: 100 });
  });
});

describe('listChecklistItemsCommand', () => {
  it('defaults to the first page of 100', () => {
    assert.deepEqual(listChecklistItemsCommand.parse({}), { page: 1, limit: 100 });
  });

  it('rejects unknown query keys, a bad record type, an empty lead id and a page size over 1000', () => {
    for (const query of [{ from: '2026-01-01' }, { recordType: 'other' }, { leadId: '' }, { limit: '1001' }, { page: '0' }]) {
      assert.equal(listChecklistItemsCommand.safeParse(query).success, false, JSON.stringify(query));
    }
  });
});
