import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Model } from 'mongoose';
import type { NoteRow } from './map-note-to-dto';
import { listNotesCommand } from './list-notes.command';
import { listNotes } from './list-notes.usecase';

type ModelStub = Pick<Model<unknown>, 'aggregate'>;
type Stage = Record<string, unknown>;

const row = (overrides: Partial<NoteRow> = {}): NoteRow => ({
  _id: { toString: () => '65f000000000000000000001' },
  lead_id: '1234567890123456789',
  record_type: 'visa_application',
  notes: {
    _id: { toString: () => '65f0000000000000000000c1' },
    note: 'Client asked for a call back',
    addedBy: 'priya',
    addedAt: new Date('2026-04-10T08:15:00.000Z'),
  },
  ...overrides,
});

const stubModel = (rows: NoteRow[], total: number | null) => {
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

describe('listNotes', () => {
  it('orders by application created time, _id, then array position, and pages the notes', async () => {
    const { model, pipelines, diskUse } = stubModel([row()], 640);

    const result = await listNotes(listNotesCommand.parse({ page: '2', limit: '300' }), model);

    const [items] = pipelines;
    const names = items.map((stage) => Object.keys(stage)[0]);
    assert.deepEqual(names, ['$match', '$project', '$sort', '$unwind', '$skip', '$limit']);
    assert.deepEqual(stageOf(items, '$sort'), { created_at: 1, _id: 1 });
    assert.equal(stageOf(items, '$unwind'), '$notes');
    assert.equal(stageOf(items, '$skip'), 300);
    assert.equal(stageOf(items, '$limit'), 300);
    assert.deepEqual(diskUse, [true]);
    assert.equal(result.total, 640);
    assert.equal(result.page, 2);
    assert.equal(result.limit, 300);
  });

  it('projects only the columns it maps, never anything else from the application', async () => {
    const { model, pipelines } = stubModel([], 0);

    await listNotes(listNotesCommand.parse({}), model);

    assert.deepEqual(stageOf(pipelines[0], '$project'), { lead_id: 1, record_type: 1, created_at: 1, notes: 1 });
  });

  it('counts notes, not applications, with the same filter as the page', async () => {
    const { model, pipelines } = stubModel([], 0);

    await listNotes(listNotesCommand.parse({ leadId: '99', recordType: 'spouse_skill_assessment' }), model);

    const expected = { 'notes.0': { $exists: true }, lead_id: '99', record_type: 'spouse_skill_assessment' };
    assert.deepEqual(stageOf(pipelines[0], '$match'), expected);
    assert.deepEqual(stageOf(pipelines[1], '$match'), expected);
    assert.deepEqual(stageOf(pipelines[1], '$group'), { _id: null, total: { $sum: { $size: '$notes' } } });
  });

  it('only matches applications that have notes when no filter is given', async () => {
    const { model, pipelines } = stubModel([], 0);

    await listNotes(listNotesCommand.parse({}), model);

    assert.deepEqual(stageOf(pipelines[0], '$match'), { 'notes.0': { $exists: true } });
  });

  it('maps a note to the row shape with its own id, the application id and the lead id', async () => {
    const { model } = stubModel([row()], 1);

    const { data } = await listNotes(listNotesCommand.parse({}), model);

    assert.deepEqual(data, [
      {
        externalId: '65f0000000000000000000c1',
        parentExternalId: '65f000000000000000000001',
        leadId: '1234567890123456789',
        recordType: 'visa_application',
        note: 'Client asked for a call back',
        addedBy: 'priya',
        addedAt: '2026-04-10T08:15:00.000Z',
      },
    ]);
  });

  it('answers null for a missing date and a missing record type', async () => {
    const base = row();
    const sparse = row({ record_type: undefined, notes: { ...base.notes, addedAt: undefined } });
    const { model } = stubModel([sparse], 1);

    const { data } = await listNotes(listNotesCommand.parse({}), model);

    assert.equal(data[0].recordType, null);
    assert.equal(data[0].addedAt, null);
  });

  it('reports a total of 0 when nothing matches', async () => {
    const { model } = stubModel([], null);

    const result = await listNotes(listNotesCommand.parse({}), model);

    assert.deepEqual(result, { data: [], total: 0, page: 1, limit: 100 });
  });
});

describe('listNotesCommand', () => {
  it('defaults to the first page of 100', () => {
    assert.deepEqual(listNotesCommand.parse({}), { page: 1, limit: 100 });
  });

  it('rejects unknown query keys, a bad record type, an empty lead id and a bad page size', () => {
    for (const query of [{ from: '2026-01-01' }, { recordType: 'other' }, { leadId: '' }, { limit: '1001' }, { page: '0' }]) {
      assert.equal(listNotesCommand.safeParse(query).success, false, JSON.stringify(query));
    }
  });
});
