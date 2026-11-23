import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Model } from 'mongoose';
import { APPLICATION_COLUMNS, type ApplicationRow } from './map-application-to-dto';
import { listApplicationsCommand } from './list-applications.command';
import { buildApplicationFilter, listApplications } from './list-applications.usecase';

type ModelStub = Pick<Model<ApplicationRow>, 'find' | 'countDocuments'>;

const row = (overrides: Partial<ApplicationRow> = {}): ApplicationRow => ({
  _id: { toString: () => '65f000000000000000000001' },
  lead_id: '1234567890123456789',
  record_type: 'visa_application',
  name: 'Asha Rao',
  email: 'asha@example.com',
  phone: '9876543210',
  lead_owner: 'case.officer',
  ...overrides,
});

const stubModel = (rows: ApplicationRow[], total: number) => {
  const calls: Record<string, unknown> = {};
  const query = {
    select: (columns: string) => ((calls.select = columns), query),
    sort: (order: unknown) => ((calls.sort = order), query),
    skip: (count: number) => ((calls.skip = count), query),
    limit: (count: number) => ((calls.limit = count), query),
    allowDiskUse: (enabled: boolean) => ((calls.allowDiskUse = enabled), query),
    lean: async () => rows,
  };
  const model = {
    find: (filter: unknown) => ((calls.filter = filter), query),
    countDocuments: async () => total,
  } as unknown as ModelStub;
  return { model, calls };
};

describe('listApplications', () => {
  it('pages in a total order and reports the matching total', async () => {
    const { model, calls } = stubModel([row()], 2267);
    const command = listApplicationsCommand.parse({ page: '3', limit: '500' });

    const result = await listApplications(command, model);

    assert.deepEqual(calls.sort, { created_at: 1, _id: 1 });
    assert.equal(calls.skip, 1000);
    assert.equal(calls.limit, 500);
    assert.equal(calls.allowDiskUse, true);
    assert.equal(result.total, 2267);
    assert.equal(result.page, 3);
    assert.equal(result.limit, 500);
  });

  it('selects only the allow-listed columns, never secrets or embedded arrays', async () => {
    const { model, calls } = stubModel([], 0);

    await listApplications(listApplicationsCommand.parse({}), model);

    const selected = String(calls.select).split(' ');
    assert.equal(selected.join(' '), APPLICATION_COLUMNS.join(' '));
    for (const forbidden of ['password', 'password_value', 'checklist', 'notes', 'deadline_extensions', 'clerk_id']) {
      assert.ok(!selected.includes(forbidden), forbidden);
    }
  });

  it('maps a row with missing optional values to nulls and never to 1970', async () => {
    const { model } = stubModel(
      [row({ zoho_created_time: null, zoho_modified_time: new Date(0), created_at: new Date('2024-05-01T10:00:00Z') })],
      1
    );

    const [item] = (await listApplications(listApplicationsCommand.parse({}), model)).data;

    assert.equal(item.externalId, '65f000000000000000000001');
    assert.equal(item.leadId, '1234567890123456789');
    assert.equal(item.createdAt, null);
    assert.equal(item.modifiedAt, null);
    assert.equal(item.dmsCreatedAt, '2024-05-01T10:00:00.000Z');
    assert.equal(item.applicationState, null);
    assert.ok(!('password' in item));
  });

  it('returns a null record type for a row that has none', async () => {
    const { model } = stubModel([row({ record_type: null })], 1);

    const [item] = (await listApplications(listApplicationsCommand.parse({}), model)).data;

    assert.equal(item.recordType, null);
  });
});

describe('buildApplicationFilter', () => {
  it('has no conditions when nothing is asked for', () => {
    assert.deepEqual(buildApplicationFilter(listApplicationsCommand.parse({})), {});
  });

  it('filters by record type and an inclusive-from, exclusive-to window on created_at', () => {
    const command = listApplicationsCommand.parse({
      recordType: 'spouse_skill_assessment',
      from: '2024-01-01',
      to: '2024-02-01T00:00:00Z',
    });

    assert.deepEqual(buildApplicationFilter(command), {
      record_type: 'spouse_skill_assessment',
      created_at: { $gte: new Date('2024-01-01'), $lt: new Date('2024-02-01T00:00:00Z') },
    });
  });
});

describe('listApplicationsCommand', () => {
  it('defaults to page 1 and 100 rows', () => {
    const command = listApplicationsCommand.parse({});
    assert.equal(command.page, 1);
    assert.equal(command.limit, 100);
  });

  it('rejects a limit above 1000, an unknown record type and a reversed window', () => {
    assert.equal(listApplicationsCommand.safeParse({ limit: '1001' }).success, false);
    assert.equal(listApplicationsCommand.safeParse({ recordType: 'main' }).success, false);
    assert.equal(listApplicationsCommand.safeParse({ from: '2024-02-01', to: '2024-01-01' }).success, false);
    assert.equal(listApplicationsCommand.safeParse({ from: 'yesterday' }).success, false);
  });

  it('rejects an unknown query key instead of silently returning every row', () => {
    assert.equal(listApplicationsCommand.safeParse({ recordtype: 'visa_application' }).success, false);
    assert.equal(listApplicationsCommand.safeParse({ leadId: '1' }).success, false);
  });
});
